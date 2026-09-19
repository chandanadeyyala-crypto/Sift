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
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

/**
 * Send a text prompt to Gemini and return the raw text response.
 */
async function geminiChat(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env')

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as GeminiResponse
  return data.candidates[0]?.content?.parts[0]?.text ?? ''
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
  return data.candidates[0]?.content?.parts[0]?.text ?? ''
}

/**
 * Run the full contract analysis through Gemini.
 */
export async function analyzeContract(
  contractText: string,
  userAnswers: Record<string, string>
): Promise<ContractAnalysis> {
  const prompt = buildAnalysisPrompt(contractText, userAnswers)
  const raw = await geminiChat(prompt)

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(cleaned) as ContractAnalysis
  } catch {
    throw new Error('Failed to parse Gemini response as JSON. Raw: ' + cleaned.slice(0, 300))
  }
}
