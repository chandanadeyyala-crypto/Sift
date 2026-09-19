import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { saveNewSession, getSession, updateSession } from '../services/sessionStore'
import { extractTextFromImage, analyzeContract } from '../services/gemini'
import { ContractSession } from '../models/contract'

const router = Router()

// ── Multer: store file in memory (no disk writes) ──────────
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})

// ─────────────────────────────────────────────────────────────
// POST /api/contracts/upload
// Accepts a file, extracts text (via Gemini Vision for images,
// or directly for PDFs/text), creates a Firestore session.
// ─────────────────────────────────────────────────────────────
router.post(
  '/upload',
  upload.single('contract'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' })
        return
      }

      const { mimetype, buffer } = req.file

      if (!ALLOWED_MIMETYPES.has(mimetype)) {
        res.status(415).json({ error: `Unsupported file type: ${mimetype}. Use PDF, JPG, PNG, WebP, or TXT.` })
        return
      }
      let extractedText = ''

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

      if (!extractedText.trim()) {
        res.status(422).json({ error: 'Could not extract text from the uploaded file.' })
        return
      }

      // Detect contract type heuristically (refined by AI in next step)
      const contractType = detectContractType(extractedText)

      // Persist session
      const sessionId = randomUUID()
      await saveNewSession({
        sessionId,
        extractedText,
        contractType,
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
// ─────────────────────────────────────────────────────────────
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
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
      res.status(404).json({ error: 'Session not found.' })
      return
    }

    // Run AI analysis
    const analysis = await analyzeContract(session.extractedText, answers ?? {})

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
router.get('/report/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params
    const session = await getSession(sessionId)

    if (!session) {
      res.status(404).json({ error: 'Report not found.' })
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
