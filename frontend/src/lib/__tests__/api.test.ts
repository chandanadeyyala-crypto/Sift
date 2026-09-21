import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { uploadContract, submitAnswers, getReport, askQuestion, translateReport } from '../api'

describe('Frontend API Client (lib/api)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('uploadContract', () => {
    it('sends file via FormData to /api/contracts/upload', async () => {
      const mockResponse = {
        sessionId: 'test-session-123',
        contractType: 'NDA',
        extractedText: 'Confidentiality agreement...',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const fakeFile = new File(['test contract'], 'contract.pdf', { type: 'application/pdf' })
      const res = await uploadContract(fakeFile)

      expect(global.fetch).toHaveBeenCalledWith('/api/contracts/upload', expect.objectContaining({
        method: 'POST',
      }))
      expect(res.sessionId).toBe('test-session-123')
      expect(res.contractType).toBe('NDA')
    })

    it('throws server error message if response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'No file uploaded.' }),
      } as Response)

      const fakeFile = new File([''], 'empty.pdf', { type: 'application/pdf' })
      await expect(uploadContract(fakeFile)).rejects.toThrow('No file uploaded.')
    })
  })

  describe('submitAnswers', () => {
    it('posts sessionId and answers to /api/contracts/analyze', async () => {
      const mockReport = {
        sessionId: 'test-session-123',
        summary: 'Agreement summary',
        plainLanguage: 'Breakdown',
        risks: [],
        missing: [],
        obligations: { yours: [], clients: [] },
        lawyerQuestions: [],
        generatedAt: '2026-09-21T12:00:00Z',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      } as Response)

      const res = await submitAnswers({ sessionId: 'test-session-123', answers: { 'Q1': 'A1' } })
      expect(global.fetch).toHaveBeenCalledWith('/api/contracts/analyze', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'test-session-123', answers: { 'Q1': 'A1' } }),
      }))
      expect(res.summary).toBe('Agreement summary')
    })
  })

  describe('getReport', () => {
    it('fetches report from /api/contracts/report/:sessionId', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sessionId: 'abc', summary: 'Found' }),
      } as Response)

      const res = await getReport('abc')
      expect(global.fetch).toHaveBeenCalledWith('/api/contracts/report/abc', expect.anything())
      expect(res.summary).toBe('Found')
    })
  })

  describe('askQuestion', () => {
    it('posts question to /api/contracts/ask', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ answer: '40 hours per week' }),
      } as Response)

      const res = await askQuestion({ sessionId: 'abc', question: 'What are the hours?' })
      expect(global.fetch).toHaveBeenCalledWith('/api/contracts/ask', expect.objectContaining({
        method: 'POST',
      }))
      expect(res.answer).toBe('40 hours per week')
    })
  })

  describe('translateReport', () => {
    it('posts target language to /api/contracts/translate', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ summary: 'Hindi summary', targetLanguage: 'Hindi' }),
      } as Response)

      const res = await translateReport({ sessionId: 'abc', targetLanguage: 'Hindi' })
      expect(global.fetch).toHaveBeenCalledWith('/api/contracts/translate', expect.objectContaining({
        method: 'POST',
      }))
      expect(res.targetLanguage).toBe('Hindi')
    })
  })
})
