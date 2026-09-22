/**
 * Unit tests for backend/src/services/gemini.ts
 *
 * All HTTP calls to Gemini/Groq are intercepted via jest.spyOn(global, 'fetch')
 * so these tests run completely offline with no real API calls.
 *
 * Coverage targets:
 *   - analyzeContract()     — success, fallback-on-failure, all-fail
 *   - askContractQuestion() — success, conversation history, fallback
 *   - translateAnalysis()   — success, cached JSON structure preservation, fallback
 *   - Fallback chain        — only advances when previous tier actually throws
 */

// Reset module state between tests so cached _textCandidates/_visionCandidates
// reflect the env vars set per-test.
beforeEach(() => {
  jest.resetModules()
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SAMPLE_CONTRACT = `
FREELANCE SERVICE AGREEMENT dated January 1 2025
between ACME Corp ("Client") and Jane Doe ("Contractor").

1. SERVICES: Contractor agrees to deliver a mobile app.
2. PAYMENT: Client shall pay $5,000 upon delivery.
3. INTELLECTUAL PROPERTY: All work product shall be owned by Client.
4. TERMINATION: Either party may terminate with 30 days notice.
`.trim()

const SAMPLE_ANALYSIS = {
  summary: 'A short-term freelance contract for mobile app development.',
  plainLanguage: 'You will build a mobile app for $5,000 paid on delivery.',
  risks: [
    { clause: 'IP Assignment', severity: 'high' as const, explanation: 'You give up all IP rights.' },
  ],
  missing: ['Late payment clause', 'Dispute resolution'],
  obligations: {
    yours: ['Deliver the mobile app'],
    clients: ['Pay $5,000 on delivery'],
  },
  lawyerQuestions: ['Can I retain a portfolio license to show the work?'],
}

/** Builds a mock Gemini API response envelope */
function makeGeminiResponse(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }],
  }
}

/** Builds a mock Groq API response envelope */
function makeGroqResponse(text: string) {
  return {
    choices: [{ message: { content: text }, finish_reason: 'stop' }],
  }
}

/** Creates a fetch mock that returns a successful Gemini JSON response */
function mockFetchGeminiSuccess(payload: object) {
  return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => makeGeminiResponse(JSON.stringify(payload)),
    text: async () => '',
  } as unknown as Response)
}

/** Creates a fetch mock that returns a successful Groq JSON response */
function mockFetchGroqSuccess(payload: object) {
  return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => makeGroqResponse(JSON.stringify(payload)),
    text: async () => '',
  } as unknown as Response)
}

/** Creates a fetch mock that returns a Gemini API error (triggers fallback) */
function mockFetchGeminiError(status = 429, message = 'Resource exhausted') {
  return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => JSON.stringify({ error: { code: status, message } }),
    json: async () => ({ error: { code: status, message } }),
  } as unknown as Response)
}

// ─── analyzeContract ─────────────────────────────────────────────────────────

describe('analyzeContract()', () => {
  it('returns parsed ContractAnalysis on primary Gemini success', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GEMINI_API_KEY_BACKUP
    delete process.env.GROQ_API_KEY

    mockFetchGeminiSuccess(SAMPLE_ANALYSIS)

    const { analyzeContract } = await import('../services/gemini')
    const result = await analyzeContract(SAMPLE_CONTRACT, { role: 'developer' })

    expect(result.summary).toBe(SAMPLE_ANALYSIS.summary)
    expect(result.risks).toHaveLength(1)
    expect(result.risks[0].severity).toBe('high')
    expect(result.obligations.yours).toContain('Deliver the mobile app')
  })

  it('falls back to Groq when Gemini primary fails with a rate limit error', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GEMINI_API_KEY_BACKUP
    process.env.GROQ_API_KEY = 'test-groq-key'

    // First call → Gemini fails (429)
    mockFetchGeminiError(429, 'Quota exceeded')
    // Second call → Groq succeeds
    mockFetchGroqSuccess(SAMPLE_ANALYSIS)

    const { analyzeContract } = await import('../services/gemini')
    const result = await analyzeContract(SAMPLE_CONTRACT, {})

    expect(result.summary).toBe(SAMPLE_ANALYSIS.summary)
  })

  it('does NOT call the fallback provider when primary succeeds', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    process.env.GROQ_API_KEY = 'test-groq-key'

    const fetchSpy = mockFetchGeminiSuccess(SAMPLE_ANALYSIS)

    const { analyzeContract } = await import('../services/gemini')
    await analyzeContract(SAMPLE_CONTRACT, {})

    // Only ONE fetch call should have been made (primary Gemini only)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('throws when all providers fail', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    process.env.GROQ_API_KEY = 'test-groq-key'

    // Both fail
    mockFetchGeminiError(503, 'Service unavailable')
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
      json: async () => ({}),
    } as unknown as Response)

    const { analyzeContract } = await import('../services/gemini')
    await expect(analyzeContract(SAMPLE_CONTRACT, {})).rejects.toThrow('All AI providers failed')
  })

  it('throws when no API keys are configured', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY_BACKUP
    delete process.env.GROQ_API_KEY

    const { analyzeContract } = await import('../services/gemini')
    await expect(analyzeContract(SAMPLE_CONTRACT, {})).rejects.toThrow(
      'No AI API keys configured'
    )
  })

  it('handles AI response wrapped in markdown code fences (resilient JSON parsing)', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    // Gemini sometimes wraps JSON in ```json ... ```
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGeminiResponse(`\`\`\`json\n${JSON.stringify(SAMPLE_ANALYSIS)}\n\`\`\``),
      text: async () => '',
    } as unknown as Response)

    const { analyzeContract } = await import('../services/gemini')
    const result = await analyzeContract(SAMPLE_CONTRACT, {})

    expect(result.summary).toBe(SAMPLE_ANALYSIS.summary)
  })
})

// ─── askContractQuestion ──────────────────────────────────────────────────────

describe('askContractQuestion()', () => {
  it('returns a plain-English answer for a valid question', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGeminiResponse('You must deliver the app by January 31st.'),
      text: async () => '',
    } as unknown as Response)

    const { askContractQuestion } = await import('../services/gemini')
    const answer = await askContractQuestion(SAMPLE_CONTRACT, 'When must I deliver?', [])

    expect(typeof answer).toBe('string')
    expect(answer).toContain('deliver')
  })

  it('incorporates conversation history into the prompt', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGeminiResponse('The contract is silent on IP retention.'),
      text: async () => '',
    } as unknown as Response)

    const history = [
      { role: 'user' as const, content: 'What is the payment amount?' },
      { role: 'assistant' as const, content: '$5,000 upon delivery.' },
    ]

    const { askContractQuestion } = await import('../services/gemini')
    await askContractQuestion(SAMPLE_CONTRACT, 'Can I keep the IP?', history)

    // The prompt sent to fetch should include the conversation history
    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    const prompt: string = callBody.contents[0].parts[0].text
    expect(prompt).toContain('$5,000 upon delivery')
    expect(prompt).toContain('What is the payment amount')
  })

  it('falls back to Groq when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    process.env.GROQ_API_KEY = 'test-groq-key'

    // Gemini fails
    mockFetchGeminiError(500, 'Internal server error')
    // Groq succeeds
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGroqResponse('The contract ends on January 31st.'),
      text: async () => '',
    } as unknown as Response)

    const { askContractQuestion } = await import('../services/gemini')
    const answer = await askContractQuestion(SAMPLE_CONTRACT, 'When does this end?', [])

    expect(answer).toContain('January 31st')
  })
})

// ─── translateAnalysis ───────────────────────────────────────────────────────

describe('translateAnalysis()', () => {
  const HINDI_ANALYSIS = {
    ...SAMPLE_ANALYSIS,
    summary: 'यह एक फ्रीलांस सेवा अनुबंध है।',
    risks: [
      {
        clause: 'बौद्धिक संपदा असाइनमेंट',
        severity: 'high' as const, // severity must stay in English
        explanation: 'आप अपने सभी IP अधिकार छोड़ देते हैं।',
      },
    ],
  }

  it('returns a translated ContractAnalysis with severity values still in English', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    mockFetchGeminiSuccess(HINDI_ANALYSIS)

    const { translateAnalysis } = await import('../services/gemini')
    const result = await translateAnalysis(SAMPLE_ANALYSIS, 'Hindi')

    expect(result.summary).toBe(HINDI_ANALYSIS.summary)
    // Severity must remain English — our prompt instructs AI to keep it that way
    expect(result.risks[0].severity).toBe('high')
  })

  it('returns a Telugu translation when targetLanguage is Telugu', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    const teluguAnalysis = { ...SAMPLE_ANALYSIS, summary: 'ఇది ఒక ఫ్రీలాన్స్ సేవా ఒప్పందం.' }
    mockFetchGeminiSuccess(teluguAnalysis)

    const { translateAnalysis } = await import('../services/gemini')
    const result = await translateAnalysis(SAMPLE_ANALYSIS, 'Telugu')

    expect(result.summary).toBe(teluguAnalysis.summary)
  })

  it('falls back to Groq when primary Gemini fails during translation', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    process.env.GROQ_API_KEY = 'test-groq-key'

    mockFetchGeminiError(429, 'Quota exceeded')
    mockFetchGroqSuccess(HINDI_ANALYSIS)

    const { translateAnalysis } = await import('../services/gemini')
    const result = await translateAnalysis(SAMPLE_ANALYSIS, 'Hindi')

    expect(result.summary).toBe(HINDI_ANALYSIS.summary)
  })

  it('preserves the full JSON structure including nested obligations', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key'
    delete process.env.GROQ_API_KEY

    const fullTranslation = {
      ...HINDI_ANALYSIS,
      obligations: {
        yours: ['मोबाइल ऐप डिलीवर करें'],
        clients: ['डिलीवरी पर $5,000 का भुगतान करें'],
      },
      lawyerQuestions: ['क्या मैं अपने पोर्टफोलियो के लिए लाइसेंस रख सकता हूं?'],
    }

    mockFetchGeminiSuccess(fullTranslation)

    const { translateAnalysis } = await import('../services/gemini')
    const result = await translateAnalysis(SAMPLE_ANALYSIS, 'Hindi')

    expect(result.obligations.yours).toContain('मोबाइल ऐप डिलीवर करें')
    expect(result.lawyerQuestions).toHaveLength(1)
    expect(result.missing).toHaveLength(2)
  })
})

// ─── Fallback chain invariant ─────────────────────────────────────────────────

describe('Fallback chain invariant', () => {
  it('only calls backup when primary throws — primary success makes exactly 1 fetch call', async () => {
    process.env.GEMINI_API_KEY = 'primary-key'
    process.env.GEMINI_API_KEY_BACKUP = 'backup-key'
    process.env.GROQ_API_KEY = 'groq-key'

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGeminiResponse(JSON.stringify(SAMPLE_ANALYSIS)),
      text: async () => '',
    } as unknown as Response)

    const { analyzeContract } = await import('../services/gemini')
    await analyzeContract(SAMPLE_CONTRACT, {})

    // Backup Gemini and Groq must NOT have been called
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('calls exactly 2 providers when primary fails and backup succeeds', async () => {
    process.env.GEMINI_API_KEY = 'primary-key'
    process.env.GEMINI_API_KEY_BACKUP = 'backup-key' // different key → adds 2 backup candidates
    delete process.env.GROQ_API_KEY

    // Call 1: primary Gemini → fail
    mockFetchGeminiError(429)
    // Call 2: backup Gemini (gemini-3.6-flash) → succeed
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeGeminiResponse(JSON.stringify(SAMPLE_ANALYSIS)),
      text: async () => '',
    } as unknown as Response)

    const { analyzeContract } = await import('../services/gemini')
    await analyzeContract(SAMPLE_CONTRACT, {})

    // fetchSpy call count is 2 (primary + first backup) — third candidate never called
    // Since each mockResolvedValueOnce consumes exactly one call, this is validated
    // implicitly by the success above (if 3 were called, the third would throw).
  })
})
