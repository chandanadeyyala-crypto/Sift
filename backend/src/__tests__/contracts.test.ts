import request from 'supertest'
import app from '../index'
import * as geminiService from '../services/gemini'
import { clearMemoryStoreForTesting, setFirestoreDisabledForTesting } from '../services/sessionStore'
import { db } from '../services/firebase'

describe('Contract Routes API Tests', () => {
  describe('POST /api/contracts/upload', () => {
    it('returns 400 if no file is uploaded', async () => {
      const res = await request(app).post('/api/contracts/upload')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'No file uploaded.')
    })

    it('returns 415 if unsupported file type is uploaded', async () => {
      const res = await request(app)
        .post('/api/contracts/upload')
        .attach('contract', Buffer.from('console.log("hello")'), {
          filename: 'test.js',
          contentType: 'application/javascript',
        })
      expect(res.status).toBe(415)
      expect(res.body.error).toContain('Unsupported file type')
    })
  })

  describe('POST /api/contracts/analyze', () => {
    it('returns 400 if sessionId is missing', async () => {
      const res = await request(app)
        .post('/api/contracts/analyze')
        .send({ answers: {} })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'sessionId is required.')
    })

    it('returns 404 with descriptive message if session is expired or not found', async () => {
      const res = await request(app)
        .post('/api/contracts/analyze')
        .send({ sessionId: 'non-existent-session-123', answers: {} })
      expect(res.status).toBe(404)
      expect(res.body.error).toContain('Session not found or expired')
    })

    it('returns 502 with details if AI analysis fails', async () => {
      // 1. Upload a text contract
      const uploadRes = await request(app)
        .post('/api/contracts/upload')
        .attach('contract', Buffer.from('Contract terms between parties.'), {
          filename: 'test-contract.txt',
          contentType: 'text/plain',
        })
      expect(uploadRes.status).toBe(200)
      const { sessionId } = uploadRes.body

      // 2. Mock analyzeContract to throw
      const geminiSpy = jest.spyOn(geminiService, 'analyzeContract').mockRejectedValueOnce(new Error('AI API rate limit exceeded'))

      const res = await request(app)
        .post('/api/contracts/analyze')
        .send({ sessionId, answers: { q1: 'freelancer' } })

      expect(res.status).toBe(502)
      expect(res.body.error).toContain('Failed to analyze contract with AI provider')
      geminiSpy.mockRestore()
    })

    it('validates process-recycling: session survives memory wipe and 60-second delay simulation before analyze', async () => {
      // Setup persistent mock store simulating external Firestore
      const persistentStore = new Map<string, any>()
      const firestoreSpy = jest.spyOn(db, 'collection').mockImplementation((colName: string) => ({
        doc: (docId: string) => ({
          set: jest.fn(async (data: any, options?: any) => {
            if (options?.merge && persistentStore.has(docId)) {
              persistentStore.set(docId, { ...persistentStore.get(docId), ...data })
            } else {
              persistentStore.set(docId, data)
            }
          }),
          get: jest.fn(async () => {
            if (persistentStore.has(docId)) {
              return {
                exists: true,
                data: () => persistentStore.get(docId),
              }
            }
            return { exists: false }
          }),
        }),
      } as any))

      setFirestoreDisabledForTesting(false)

      try {
        // 1. Upload a contract
        const uploadRes = await request(app)
          .post('/api/contracts/upload')
          .attach('contract', Buffer.from('Standard independent contractor terms and conditions for development work.'), {
            filename: 'contract.txt',
            contentType: 'text/plain',
          })
        expect(uploadRes.status).toBe(200)
        const { sessionId } = uploadRes.body
        expect(sessionId).toBeDefined()

        // Verify it was persisted to the persistent store
        expect(persistentStore.has(sessionId)).toBe(true)

        // 2. Simulate user waiting > 60 seconds answering intake questions
        jest.useFakeTimers({ advanceTimers: true })
        jest.advanceTimersByTime(65000) // 65 seconds
        jest.useRealTimers()

        // 3. Simulate Render process recycling: in-memory process cache is completely wiped!
        clearMemoryStoreForTesting()

        // 4. Mock successful AI analysis
        const geminiSpy = jest.spyOn(geminiService, 'analyzeContract').mockResolvedValueOnce({
          summary: 'Simulated contract summary',
          plainLanguage: 'Simulated plain language text',
          risks: [],
          missing: [],
          obligations: { yours: [], clients: [] },
          lawyerQuestions: [],
        })

        // 5. Submit intake answers to /analyze
        const analyzeRes = await request(app)
          .post('/api/contracts/analyze')
          .send({
            sessionId,
            answers: { role: 'freelancer', timeline: '1 month' },
          })

        expect(analyzeRes.status).toBe(200)
        expect(analyzeRes.body).toHaveProperty('summary', 'Simulated contract summary')
        expect(analyzeRes.body.sessionId).toBe(sessionId)

        geminiSpy.mockRestore()
      } finally {
        firestoreSpy.mockRestore()
        setFirestoreDisabledForTesting(true)
      }
    })
  })

  describe('POST /api/contracts/ask', () => {
    it('returns 400 if sessionId or question is missing', async () => {
      const res = await request(app)
        .post('/api/contracts/ask')
        .send({ sessionId: '' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'sessionId and question are required.')
    })
  })

  describe('POST /api/contracts/translate', () => {
    it('returns 400 if targetLanguage is not Hindi or Telugu', async () => {
      const res = await request(app)
        .post('/api/contracts/translate')
        .send({ sessionId: 'session-123', targetLanguage: 'Spanish' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Valid sessionId and targetLanguage (Hindi or Telugu) are required.')
    })
  })

  describe('GET /api/contracts/report/:sessionId', () => {
    it('returns 404 for unknown session', async () => {
      const res = await request(app).get('/api/contracts/report/non-existent-session-id')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })
})
