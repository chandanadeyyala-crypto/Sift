/**
 * Builds the system + user prompt for contract analysis.
 * The AI must return ONLY a valid JSON object matching ContractAnalysis.
 */
export function buildAnalysisPrompt(
  contractText: string,
  userAnswers: Record<string, string>
): string {
  const context = Object.entries(userAnswers)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  return `You are a contract analyst helping a freelancer understand a contract before signing it.

## User context
${context || '- No additional context provided.'}

## Contract text
<contract>
${contractText}
</contract>

## Your task
Analyse this contract thoroughly. Return ONLY a valid JSON object (no markdown fences, no explanation outside JSON) with exactly this shape:

{
  "summary": "2–3 sentence plain-English summary of the whole contract",
  "plainLanguage": "A section-by-section plain-English breakdown of what the contract says. Use simple language a non-lawyer can understand. Separate sections with a blank line.",
  "risks": [
    {
      "clause": "Short name of the clause",
      "severity": "high | medium | low | info",
      "explanation": "Why this is risky or noteworthy in plain English"
    }
  ],
  "missing": [
    "Description of an important clause that is absent from this contract"
  ],
  "obligations": {
    "yours": ["Things the freelancer/contractor must do or provide"],
    "clients": ["Things the client must do or provide"]
  },
  "lawyerQuestions": [
    "A specific question the freelancer should ask a lawyer about this contract"
  ]
}

Rules:
- severity must be one of: high, medium, low, info
- missing array should only list genuinely absent clauses that matter for this type of contract
- lawyerQuestions should be specific to this actual contract, not generic
- Write for a non-lawyer audience — no legal jargon unless explained
- Return ONLY the JSON, nothing else`
}
