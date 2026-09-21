// ─────────────────────────────────────────────────────────────
// Multi-Tier AI Service (Gemini with Groq & Secondary Key Fallback)
//
// HOW TO CONFIGURE KEYS in backend/.env:
//   GEMINI_API_KEY        → Primary Gemini API key (https://aistudio.google.com/app/apikey)
//   GEMINI_API_KEY_BACKUP → Optional secondary Gemini API key for quota/rate limit backup
//   GROQ_API_KEY          → Groq API key for high-speed fallback (https://console.groq.com/keys)
//   GROQ_MODEL            → Optional model override (default: openai/gpt-oss-120b)
// ─────────────────────────────────────────────────────────────

import { ContractAnalysis } from '../models/contract'
import { buildAnalysisPrompt } from '../prompts/analysisPrompt'

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  error?: {
    code: number
    message: string
  }
}

interface GroqResponse {
  choices?: Array<{
    message?: { content?: string }
    finish_reason?: string
  }>
  error?: {
    message: string
    code?: string
    type?: string
  }
}

/**
 * Call the Gemini API with a specific key.
 */
async function callGemini(prompt: string, jsonMode = false, apiKey: string): Promise<string> {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${body}`)
  }

  const data = (await res.json()) as GeminiResponse
  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`)
  }

  const candidate = data.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`Gemini returned empty text (finish reason: ${candidate?.finishReason ?? 'unknown'})`)
  }

  return text
}

/**
 * Call the Groq API with a specific key.
 */
async function callGroq(prompt: string, jsonMode = false, apiKey: string): Promise<string> {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 8192,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API error (${res.status}): ${body}`)
  }

  const data = (await res.json()) as GroqResponse
  if (data.error) {
    throw new Error(`Groq error: ${data.error.message}`)
  }

  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error(`Groq returned empty text (finish reason: ${data.choices?.[0]?.finish_reason ?? 'unknown'})`)
  }

  return text
}

/**
 * Executes a text/JSON completion prompt across available AI providers in prioritized order:
 * 1. Primary Gemini (GEMINI_API_KEY)
 * 2. Backup Gemini (GEMINI_API_KEY_BACKUP or GEMINI_BACKUP_API_KEY)
 * 3. Groq (GROQ_API_KEY)
 */
async function geminiChat(prompt: string, jsonMode = false): Promise<string> {
  const primaryGeminiKey = process.env.GEMINI_API_KEY?.trim()
  const backupGeminiKey = (
    process.env.GEMINI_API_KEY_BACKUP?.trim() ||
    process.env.GEMINI_BACKUP_API_KEY?.trim()
  )
  const groqKey = process.env.GROQ_API_KEY?.trim()

  type ProviderCandidate = {
    name: string
    invoke: () => Promise<string>
  }

  const candidates: ProviderCandidate[] = []

  if (primaryGeminiKey) {
    candidates.push({
      name: 'Gemini (Primary)',
      invoke: () => callGemini(prompt, jsonMode, primaryGeminiKey),
    })
  }

  if (backupGeminiKey && backupGeminiKey !== primaryGeminiKey) {
    candidates.push({
      name: 'Gemini (Backup Key)',
      invoke: () => callGemini(prompt, jsonMode, backupGeminiKey),
    })
  }

  if (groqKey) {
    candidates.push({
      name: `Groq (${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'})`,
      invoke: () => callGroq(prompt, jsonMode, groqKey),
    })
  }

  if (candidates.length === 0) {
    throw new Error(
      'No AI API keys configured. Please set GEMINI_API_KEY, GEMINI_API_KEY_BACKUP, or GROQ_API_KEY in backend/.env'
    )
  }

  const errors: string[] = []

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    try {
      const result = await candidate.invoke()
      if (i > 0) {
        // Fallback succeeded
      }
      return result
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      errors.push(`${candidate.name}: ${errorMsg}`)
      console.warn(`[AI Service] ${candidate.name} failed: ${errorMsg}`)

      if (i < candidates.length - 1) {
        console.log(`[AI Service] Attempting fallback to ${candidates[i + 1].name}...`)
      }
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/**
 * Call Gemini Vision for document text extraction (OCR).
 */
async function callGeminiVision(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Extract all text from this contract document image. Return only the raw text, preserving paragraph structure.' },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini Vision error (${res.status}): ${body}`)
  }

  const data = (await res.json()) as GeminiResponse
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Send an image or PDF (base64) to Gemini Vision for OCR with primary & backup key fallback.
 */
export async function extractTextFromImage(
  base64Image: string,
  mimeType: string
): Promise<string> {
  const primaryGeminiKey = process.env.GEMINI_API_KEY?.trim()
  const backupGeminiKey = (
    process.env.GEMINI_API_KEY_BACKUP?.trim() ||
    process.env.GEMINI_BACKUP_API_KEY?.trim()
  )

  const candidates: Array<{ name: string; key: string }> = []
  if (primaryGeminiKey) candidates.push({ name: 'Gemini Primary', key: primaryGeminiKey })
  if (backupGeminiKey && backupGeminiKey !== primaryGeminiKey) {
    candidates.push({ name: 'Gemini Backup Key', key: backupGeminiKey })
  }

  if (candidates.length === 0) {
    throw new Error('No Gemini API key available for document text extraction. Please set GEMINI_API_KEY or GEMINI_API_KEY_BACKUP in .env')
  }

  const errors: string[] = []

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    try {
      const text = await callGeminiVision(base64Image, mimeType, candidate.key)
      if (i > 0) {
        // Fallback succeeded
      }
      return text
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${candidate.name}: ${msg}`)
      console.warn(`[AI OCR] ${candidate.name} failed: ${msg}`)
      if (i < candidates.length - 1) {
        console.log(`[AI OCR] Attempting OCR with ${candidates[i + 1].name}...`)
      }
    }
  }

  throw new Error(`Document text extraction failed:\n${errors.join('\n')}`)
}

/**
 * Resilient JSON parsing helper
 */
function cleanAndParseJson<T>(raw: string): T {
  const text = raw.trim()

  // 1. Direct parse
  try {
    return JSON.parse(text) as T
  } catch {}

  // 2. Strip code fences
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(stripped) as T
  } catch {}

  // 3. Find outer braces
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = stripped.slice(start, end + 1)
    try {
      return JSON.parse(candidate) as T
    } catch {}

    // 4. Try removing trailing commas
    const fixedCommas = candidate.replace(/,\s*([}\]])/g, '$1')
    try {
      return JSON.parse(fixedCommas) as T
    } catch {}
  }

  throw new Error('Failed to parse AI response as JSON. Raw: ' + raw.slice(0, 300))
}

/**
 * Run the full contract analysis through AI (Gemini primary -> Gemini backup -> Groq fallback).
 */
export async function analyzeContract(
  contractText: string,
  userAnswers: Record<string, string>
): Promise<ContractAnalysis> {
  const prompt = buildAnalysisPrompt(contractText, userAnswers)
  const raw = await geminiChat(prompt, true)
  return cleanAndParseJson<ContractAnalysis>(raw)
}

/**
 * Ask a specific follow-up question about the contract.
 */
export async function askContractQuestion(
  contractText: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const historyFormatted = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n')

  const prompt = `You are Sift's AI Contract Assistant helping a freelancer understand their contract terms.
Answer the user's question directly, accurately, and objectively based on the contract text below.
Write in clear, accessible plain English for a non-lawyer freelancer.
If the contract does not mention or specify something, explicitly say that the contract is silent on that issue and what that usually means for the freelancer.
Keep your response concise (typically 2 to 4 clear sentences or bullet points).

<contract>
${contractText.slice(0, 30000)}
</contract>

${historyFormatted ? `## Conversation history:\n${historyFormatted}\n` : ''}

User's question:
${question}
`

  return geminiChat(prompt, false)
}

/**
 * Translate contract analysis into authentic Hindi or Telugu.
 */
export async function translateAnalysis(
  analysis: ContractAnalysis,
  targetLanguage: 'Hindi' | 'Telugu'
): Promise<ContractAnalysis> {
  const languageScript =
    targetLanguage === 'Telugu'
      ? 'Telugu (in authentic Telugu script)'
      : 'Hindi (in authentic Devanagari Hindi script)'

  const prompt = `You are a high-caliber professional legal translator specializing in contracts for freelancers in India.
Translate the following contract analysis JSON into natural, authentic, professional ${languageScript}.

CRITICAL INSTRUCTIONS:
1. Maintain the EXACT JSON structure, keys, and hierarchy.
2. In the "risks" array:
   - "clause": Translate the clause name accurately.
   - "severity": Keep the value STRICTLY in English as one of: "high", "medium", "low", "info" (DO NOT translate the severity level string).
   - "explanation": Translate the explanation into fluent, natural ${targetLanguage}.
3. Translate "summary", "plainLanguage", "missing", "obligations" (yours & clients), and "lawyerQuestions" into natural, professional ${targetLanguage} suitable for a freelancer.
4. Do NOT use crude literal machine translation. Use real, culturally natural phrasing that a native speaker easily understands.
5. Return ONLY valid JSON, with NO surrounding markdown fences or preamble.

Input JSON:
${JSON.stringify(analysis, null, 2)}
`

  const raw = await geminiChat(prompt, true)
  return cleanAndParseJson<ContractAnalysis>(raw)
}
