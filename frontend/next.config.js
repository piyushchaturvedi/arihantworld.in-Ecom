/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  // ── Images ────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol:'https', hostname:'res.cloudinary.com' },
      { protocol:'https', hostname:'arihantworld.com' },
      { protocol:'https', hostname:'arihantdivinearts.in' },
      { protocol:'https', hostname:'api.arihantworld.com' },
      { protocol:'http',  hostname:'localhost' },
    ],
    formats: ['image/avif','image/webp'],
    minimumCacheTTL: 86400,
    unoptimized: true, // Cloudinary handles optimization
  },

  // ── Compression ───────────────────────────────────────────
  compress: true,

  // ── Performance ───────────────────────────────────────────
  poweredByHeader: false, // remove X-Powered-By header
  reactStrictMode: true,
  swcMinify: true,

  // ── Output ────────────────────────────────────────────────
  output: isProd ? 'standalone' : undefined,

  // ── Build ─────────────────────────────────────────────────
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // ── Security headers ──────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key:'X-Content-Type-Options',    value:'nosniff' },
          { key:'X-Frame-Options',           value:'SAMEORIGIN' },
          { key:'Referrer-Policy',           value:'strict-origin-when-cross-origin' },
          { key:'Permissions-Policy',        value:'camera=(), microphone=()' },
          ...(isProd ? [{ key:'Strict-Transport-Security', value:'max-age=63072000; includeSubDomains; preload' }] : []),
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [{ key:'Cache-Control', value:'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2)',
        headers: [{ key:'Cache-Control', value:'public, max-age=2592000, stale-while-revalidate=86400' }],
      },
    ]
  },

  // ── Env vars exposed to browser ───────────────────────────
  env: {
    NEXT_PUBLIC_API_URL:          process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL:         process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID:  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_ENV:              process.env.NODE_ENV,
  },
}

module.exports = nextConfig
