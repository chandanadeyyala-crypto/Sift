import request from 'supertest'
import app from '../index'

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
