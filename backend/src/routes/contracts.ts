import { Router, Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { saveNewSession, getSession, updateSession } from '../services/sessionStore'
import { extractTextFromImage, analyzeContract, askContractQuestion, translateAnalysis } from '../services/gemini'
import { ContractSession } from '../models/contract'
import { optionalAuthenticate } from '../middleware/authenticate'
import { fileValidator } from '../middleware/fileValidator'

const router = Router()

// ── Apply optional authentication to all routes ──────────────
// PRODUCT DECISION: Sift intentionally allows anonymous (unauthenticated) usage
// to keep the onboarding friction-free for hackathon evaluators and freelancers
// who have not signed up. When a user IS logged in, their session is bound to
// their Firebase UID and subsequent requests verify ownership. Anonymous sessions
// (isAnonymous: true) are accessible by anyone with the sessionId — this is
// acceptable because sessionIds are UUIDs (128 bits of entropy), users do not
// share them, and no PII beyond the uploaded contract text is stored.
router.use(optionalAuthenticate as unknown as (req: Request, res: Response, next: NextFunction) => void)

// ── Session ownership helper ──────────────────────────────────
/**
 * Returns true if the requesting user is allowed to access this session.
 * - Anonymous sessions (isAnonymous: true or no userId set) are accessible
 *   by any caller who knows the sessionId (UUID with sufficient entropy).
 * - Authenticated sessions (isAnonymous: false, userId set) are only accessible
 *   by the user whose UID matches the one recorded at upload time.
 */
function isSessionOwner(session: Partial<ContractSession>, requestingUid?: string): boolean {
  // If the session was created anonymously, allow access to anyone with the sessionId
  if (session.isAnonymous === true || !session.userId) {
    return true
  }
  // Authenticated session: require matching UID
  return requestingUid === session.userId
}

// ─────────────────────────────────────────────────────────────
// POST /api/contracts/upload
// Accepts a file, extracts text (via Gemini Vision for images,
// or directly for PDFs/text), creates a Firestore session.
// Rate limiting is applied via express-rate-limit in index.ts.
// ─────────────────────────────────────────────────────────────
router.post(
  '/upload',
  fileValidator,
  async (req: Request & { uid?: string }, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' })
        return
      }

      const { mimetype, buffer } = req.file
      let extractedText = ''

      try {
        if (mimetype === 'text/plain') {
          // Plain text — decode directly
          extractedText = buffer.toString('utf-8')
        } else if (mimetype === 'application/pdf') {
          // PDF — send to Gemini Vision as base64
          const b64 = buffer.toString('base64')
          extractedText = await extractTextFromImage(b64, 'application/pdf')
        } else {
          // Image — send to Gemini Vision
          const b64 = buffer.toString('base64')
          extractedText = await extractTextFromImage(b64, mimetype)
        }
      } catch (extractErr) {
        console.error('[contracts/upload] Document text extraction failed:', extractErr)
        res.status(422).json({
          error: 'Failed to extract text from document. Please ensure the file is readable or try plain text (.txt).',
          details: extractErr instanceof Error ? extractErr.message : String(extractErr),
        })
        return
      }

      if (!extractedText || !extractedText.trim()) {
        res.status(422).json({ error: 'Could not extract text from the uploaded file.' })
        return
      }

      // Detect contract type heuristically (refined by AI in next step)
      const contractType = detectContractType(extractedText)

      // Persist session with ownership metadata
      const sessionId = randomUUID()
      const uid = req.uid
      await saveNewSession({
        sessionId,
        extractedText,
        contractType,
        ...(uid ? { userId: uid, isAnonymous: false } : { isAnonymous: true }),
      })

      res.json({ sessionId, contractType, extractedText: extractedText.slice(0, 500) + '…' })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/contracts/analyze
// Takes the sessionId + user answers, runs analysis, saves result.
// Rate limiting is applied via express-rate-limit in index.ts.
// ─────────────────────────────────────────────────────────────
router.post('/analyze', async (req: Request & { uid?: string }, res: Response, next: NextFunction) => {
  try {
    const { sessionId, answers } = req.body as {
      sessionId: string
      answers: Record<string, string>
    }

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'sessionId is required.' })
      return
    }

    const session = await getSession(sessionId)
    if (!session || !session.extractedText) {
      console.warn(`[contracts/analyze] Session ${sessionId} not found or expired in persistent store.`)
      res.status(404).json({ error: 'Session not found or expired. Please upload your contract again.' })
      return
    }

    // Enforce session ownership for authenticated sessions
    if (!isSessionOwner(session, req.uid)) {
      res.status(403).json({ error: 'You do not have permission to access this session.' })
      return
    }

    // Run AI analysis with dedicated error handling and logging
    let analysis
    try {
      analysis = await analyzeContract(session.extractedText, answers ?? {})
    } catch (aiErr) {
      console.error(`[contracts/analyze] Gemini/AI analysis failed for session ${sessionId}:`, aiErr)
      res.status(502).json({
        error: 'Failed to analyze contract with AI provider. Please try again.',
        details: aiErr instanceof Error ? aiErr.message : String(aiErr),
      })
      return
    }

    // Save result
    await updateSession(sessionId, {
      userAnswers: answers ?? {},
      analysis,
    })

    res.json({
      sessionId,
      ...analysis,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/contracts/report/:sessionId
// Fetch a previously generated report from Firestore.
// ─────────────────────────────────────────────────────────────
router.get('/report/:sessionId', async (req: Request & { uid?: string }, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params
    const session = await getSession(sessionId)

    if (!session) {
      res.status(404).json({ error: 'Report not found.' })
      return
    }

    // Enforce session ownership for authenticated sessions
    if (!isSessionOwner(session, req.uid)) {
      res.status(403).json({ error: 'You do not have permission to access this report.' })
      return
    }

    if (!session.analysis) {
      res.status(404).json({ error: 'Analysis not complete yet.' })
      return
    }

    res.json({
      sessionId,
      ...session.analysis,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/contracts/ask
// Ask follow-up questions about the contract
// ─────────────────────────────────────────────────────────────
router.post('/ask', async (req: Request & { uid?: string }, res: Response, next: NextFunction) => {
  try {
    const { sessionId, question, history } = req.body as {
      sessionId: string
      question: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!sessionId || !question?.trim()) {
      res.status(400).json({ error: 'sessionId and question are required.' })
      return
    }

    const session = await getSession(sessionId)
    if (!session || !session.extractedText) {
      res.status(404).json({ error: 'Contract session not found.' })
      return
    }

    // Enforce session ownership for authenticated sessions
    if (!isSessionOwner(session, req.uid)) {
      res.status(403).json({ error: 'You do not have permission to access this session.' })
      return
    }

    const answer = await askContractQuestion(
      session.extractedText,
      question.trim(),
      history || []
    )

    // Save to chat history
    const existingHistory = session.chatHistory || []
    const updatedHistory = [
      ...existingHistory,
      { role: 'user' as const, content: question.trim(), ts: new Date().toISOString() },
      { role: 'assistant' as const, content: answer, ts: new Date().toISOString() },
    ]
    await updateSession(sessionId, { chatHistory: updatedHistory })

    res.json({ answer, question: question.trim() })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/contracts/translate
// Translate the contract analysis into Hindi or Telugu via AI
// ─────────────────────────────────────────────────────────────
router.post('/translate', async (req: Request & { uid?: string }, res: Response, next: NextFunction) => {
  try {
    const { sessionId, targetLanguage } = req.body as {
      sessionId: string
      targetLanguage: 'Hindi' | 'Telugu'
    }

    if (!sessionId || !['Hindi', 'Telugu'].includes(targetLanguage)) {
      res.status(400).json({ error: 'Valid sessionId and targetLanguage (Hindi or Telugu) are required.' })
      return
    }

    const session = await getSession(sessionId)
    if (!session || !session.analysis) {
      res.status(404).json({ error: 'Contract report not found for this session.' })
      return
    }

    // Enforce session ownership for authenticated sessions
    if (!isSessionOwner(session, req.uid)) {
      res.status(403).json({ error: 'You do not have permission to access this session.' })
      return
    }

    // Check cached translation
    const cached = session.translations?.[targetLanguage]
    if (cached) {
      res.json({
        sessionId,
        targetLanguage,
        ...cached,
        generatedAt: new Date().toISOString(),
      })
      return
    }

    // Translate via Gemini
    const translated = await translateAnalysis(session.analysis, targetLanguage)

    // Cache translation
    const currentTranslations = session.translations || {}
    await updateSession(sessionId, {
      translations: {
        ...currentTranslations,
        [targetLanguage]: translated,
      },
    })

    res.json({
      sessionId,
      targetLanguage,
      ...translated,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function detectContractType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('non-disclosure') || lower.includes('nda')) return 'NDA'
  if (lower.includes('statement of work') || lower.includes('sow')) return 'SOW'
  if (lower.includes('master services agreement') || lower.includes('msa')) return 'MSA'
  if (lower.includes('independent contractor')) return 'Contractor Agreement'
  if (lower.includes('retainer')) return 'Retainer Agreement'
  return 'Contract'
}

export default router
