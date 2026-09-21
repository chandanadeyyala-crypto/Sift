import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import contractRoutes from './routes/contracts'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

const app = express()
const PORT = Number(process.env.PORT) || 4000
const HOST = '0.0.0.0'

// ── CORS Configuration ─────────────────────────────────────
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, and health check requests without origin
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = origin.replace(/\/$/, '')

    // Check configured FRONTEND_URL(s)
    if (configuredOrigins.includes(normalizedOrigin) || configuredOrigins.includes('*')) {
      return callback(null, true)
    }

    // Automatically allow all Vercel deployments (production and preview branches)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(normalizedOrigin)) {
      return callback(null, true)
    }

    // Automatically allow local development
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true)
    }

    // Allow all in development/test if not matched above
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    // Reject gracefully without throwing an unhandled exception
    callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours preflight cache
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

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
