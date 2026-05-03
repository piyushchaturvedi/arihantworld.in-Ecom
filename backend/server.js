'use strict'

// ─── Load correct .env file based on NODE_ENV ─────────────────────────────
const path = require('path')
const dotenv = require('dotenv')

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development'

// Load env: .env.{NODE_ENV} first, then fallback to .env
const envPath = path.resolve(__dirname, envFile)
const fallbackPath = path.resolve(__dirname, '.env')

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.log(`⚠  ${envFile} not found, trying .env`)
  dotenv.config({ path: fallbackPath })
} else {
  console.log(`✅ Loaded env: ${envFile}`)
}

const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const helmet       = require('helmet')
const morgan       = require('morgan')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit    = require('express-rate-limit')

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false, // relax CSP in dev
}))
app.use(mongoSanitize())

// ─── Trust proxy (Nginx sits in front in production) ──────────────────────
if (isProd) {
  app.set('trust proxy', 1)
}

// ─── Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || (isProd ? 200 : 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 100,
  message: { success: false, message: 'Too many auth attempts.' }
})
app.use('/api/', limiter)

// ─── CORS ──────────────────────────────────────────────────────────────────
const getAllowedOrigins = () => {
  if (!isProd) return true  // allow all in development

  const origins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  // Always allow the API subdomain itself (for health checks etc.)
  if (process.env.API_SUBDOMAIN) {
    origins.push(`https://${process.env.API_SUBDOMAIN}`)
  }
  return origins
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()
    if (allowed === true) return callback(null, true)           // dev: allow all
    if (!origin) return callback(null, true)                   // server-to-server (no origin)
    if (allowed.includes(origin)) return callback(null, true)  // whitelisted
    console.warn(`CORS blocked: ${origin}`)
    callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// ─── Logging ───────────────────────────────────────────────────────────────
if (!isProd) {
  app.use(morgan('dev'))
} else {
  // Compact production logging
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // only log errors in prod
  }))
}

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, require('./routes/auth'))
app.use('/api/products',     require('./routes/products'))
app.use('/api/cart',         require('./routes/cart'))
app.use('/api/orders',       require('./routes/orders'))
app.use('/api/profile',      require('./routes/profile'))
app.use('/api/admin',        require('./routes/admin'))
app.use('/api/wallet',       require('./routes/wallet'))
app.use('/api/consultation', require('./routes/consultation'))
app.use('/api/settings',     require('./routes/settings'))

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'Arihant World API running',
  env: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}))

// ─── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ─── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500
  console.error(`[${new Date().toISOString()}] ERROR ${status}:`, err.message)
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(isProd ? {} : { stack: err.stack }),
  })
})

// ─── Database + Server start ───────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/arihant_world',
      { serverSelectionTimeoutMS: 10000 }
    )
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 5000
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API running on port ${PORT}`)
    console.log(`📖 Environment: ${process.env.NODE_ENV}`)
    console.log(`🌐 CORS allowed: ${isProd ? process.env.ALLOWED_ORIGINS : 'ALL (dev)'}`)
  })
})

// ─── Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully…`)
  await mongoose.connection.close()
  console.log('MongoDB connection closed.')
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

module.exports = app
