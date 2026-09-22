import request from 'supertest'
import app from '../index'

describe('CORS Configuration Tests', () => {
  it('allows requests from local dev port http://localhost:5173', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })

  it('allows requests from local 127.0.0.1:5173', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://127.0.0.1:5173')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173')
  })

  it('rejects unauthorized arbitrary vercel.app domains without wildcard matching', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-phishing.vercel.app')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('rejects general third-party origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil-attacker.com')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('correctly responds to preflight OPTIONS requests', async () => {
    const res = await request(app)
      .options('/api/contracts/upload')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
    expect([200, 204]).toContain(res.status)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(res.headers['access-control-allow-methods']).toContain('POST')
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type')
  })
})
