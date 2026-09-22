import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import contractRoutes from './routes/contracts'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

// ── Global Process Safety Nets ─────────────────────────────
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception thrown:', error)
})

const app = express()
const PORT = Number(process.env.PORT) || 4000
const HOST = '0.0.0.0'

// ── CORS Configuration ─────────────────────────────────────
// Locked strictly to exact production Vercel frontend domain and local dev origins.
// Wildcards (*) and loose regex patterns matching arbitrary *.vercel.app subdomains are prohibited.
const allowedOrigins = new Set<string>([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://sift-gamma-one.vercel.app',
])

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter((url) => url && url !== '*')
    .forEach((url) => allowedOrigins.add(url))
}

if (process.env.VERCEL_URL) {
  const vercelDomain = process.env.VERCEL_URL.trim().replace(/\/$/, '')
  const formattedUrl = vercelDomain.startsWith('http') ? vercelDomain : `https://${vercelDomain}`
  allowedOrigins.add(formattedUrl)
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests without origin header (server-to-server, curl, health checks)
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, '')

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true)
    }

    // Deny origin gracefully without setting Access-Control-Allow-Origin
    return callback(null, false)
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

// ── Rate Limiting — AI-triggered endpoints ─────────────────
// Applied here (not in the router) to ensure ordering relative to middleware.
// Limit: 10 requests per IP per 15-minute window on routes that invoke paid
// Gemini API calls, preventing runaway API costs from abuse or automated scanners.
const aiEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test', // Don't rate-limit in test environment
})

app.use('/api/contracts/upload', aiEndpointLimiter)
app.use('/api/contracts/analyze', aiEndpointLimiter)

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
