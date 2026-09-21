import request from 'supertest'
import app from '../index'

describe('GET /api/health', () => {
  it('should return 200 OK with status "ok" and timestamp', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('ts')
    expect(new Date(res.body.ts).getTime()).not.toBeNaN()
  })
})
