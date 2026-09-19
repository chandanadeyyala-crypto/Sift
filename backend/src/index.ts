import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import contractRoutes from './routes/contracts'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

const app = express()
const PORT = Number(process.env.PORT) || 4000

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

app.listen(PORT, () => {
  console.log(`\n🔍 Sift API running on http://localhost:${PORT}\n`)
})

export default app
