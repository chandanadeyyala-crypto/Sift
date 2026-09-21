import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import contractRoutes from './routes/contracts'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

const app = express()
const PORT = Number(process.env.PORT) || 4000
const HOST = '0.0.0.0'

// ── Middleware ─────────────────────────────────────────────
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean)

const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173']
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...new Set([...devOrigins, ...configuredOrigins])]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }
    const normalizedOrigin = origin.replace(/\/$/, '')
    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())
app.use(requestLogger)

// ── Routes ─────────────────────────────────────────────────
app.use('/api/contracts', contractRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// ── Error handling (must be last) ─────────────────────────
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`\n🔍 Sift API running on http://${HOST}:${PORT}\n`)
  })
}

export default app
