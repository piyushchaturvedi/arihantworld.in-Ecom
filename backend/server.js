'use strict'

// ─── Load correct .env file based on NODE_ENV ─────────────────────────────
const path = require('path')
const dotenv = require('dotenv')

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development'

const envPath = path.resolve(__dirname, envFile)
const fallbackPath = path.resolve(__dirname, '.env')

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.log(`⚠  ${envFile} not found, trying .env`)
  dotenv.config({ path: fallbackPath })
} else {
  console.log(`✅ Loaded env: ${envFile}`)
}

const express       = require('express')
const mongoose      = require('mongoose')
const cors          = require('cors')
const helmet        = require('helmet')
const morgan        = require('morgan')
const compression   = require('compression')           // ✅ NEW: gzip responses
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit     = require('express-rate-limit')

const app    = express()
const isProd = process.env.NODE_ENV === 'production'

// ─── Compression (gzip) — biggest win for free ────────────────────────────
// Compress all responses > 1KB. Saves 60-70% bandwidth = faster response.
app.use(compression({
  level: 6,           // balanced speed vs compression
  threshold: 1024,    // only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  },
}))

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}))
app.use(mongoSanitize())

// ─── Trust proxy (Nginx sits in front in production) ──────────────────────
if (isProd) app.set('trust proxy', 1)

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
  if (!isProd) return true
  const origins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',').map(o => o.trim()).filter(Boolean)
  if (process.env.API_SUBDOMAIN) origins.push(`https://${process.env.API_SUBDOMAIN}`)
  return origins
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()
    if (allowed === true) return callback(null, true)
    if (!origin) return callback(null, true)
    if (allowed.includes(origin)) return callback(null, true)
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
  app.use(morgan('combined', { skip: (req, res) => res.statusCode < 400 }))
}

// ─── Response caching helper (attach to res for use in routes) ────────────
// Usage in route: res.setCache(60) → Cache-Control: public, max-age=60
app.use((req, res, next) => {
  res.setCache = (seconds) => {
    res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`)
  }
  res.noCache = () => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  }
  next()
})

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, require('./routes/auth'))
const productsRouter = require('./routes/products')
app.use('/api/products',     productsRouter)
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
    ...(isProd ? {} : { stack: err.stack }),
  })
})

// ─── Database + Server start ───────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/arihant_world',
      {
        serverSelectionTimeoutMS: 10000,
        // ✅ Connection pool — handle multiple simultaneous requests
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      }
    )
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 5000
connectDB().then(() => {
  // Warm product cache immediately after DB connects
  productsRouter.warmCache().catch(() => {})

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
