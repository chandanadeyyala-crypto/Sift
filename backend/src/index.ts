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
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || '']
  : ['http://localhost:5173', process.env.FRONTEND_URL || '']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
