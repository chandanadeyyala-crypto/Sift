// ─────────────────────────────────────────────────────────────
// Gemini API Service
//
// HOW TO ADD YOUR KEY:
//   GEMINI_API_KEY → https://aistudio.google.com/app/apikey
//   Paste into backend/.env
// ─────────────────────────────────────────────────────────────

import { ContractAnalysis } from '../models/contract'
import { buildAnalysisPrompt } from '../prompts/analysisPrompt'

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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

/**
 * Send a text prompt to Gemini and return the raw text response.
 */
async function geminiChat(prompt: string, jsonMode = false): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env')

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
    throw new Error(`Gemini API error ${res.status}: ${body}`)
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
 * Send an image (base64) + text to Gemini Vision for OCR.
 */
export async function extractTextFromImage(
  base64Image: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env')

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
    throw new Error(`Gemini Vision error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as GeminiResponse
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
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

  throw new Error('Failed to parse Gemini response as JSON. Raw: ' + raw.slice(0, 300))
}

/**
 * Run the full contract analysis through Gemini.
 */
export async function analyzeContract(
  contractText: string,
  userAnswers: Record<string, string>
): Promise<ContractAnalysis> {
  const prompt = buildAnalysisPrompt(contractText, userAnswers)
  // Request strict JSON response with responseMimeType: 'application/json'
  const raw = await geminiChat(prompt, true)

  return cleanAndParseJson<ContractAnalysis>(raw)
}
