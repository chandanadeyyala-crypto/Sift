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
