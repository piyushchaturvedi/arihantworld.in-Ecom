const express = require('express')
const router = express.Router()
const SiteSettings = require('../models/SiteSettings')

// In-memory cache — settings change rarely, no need to hit DB every request
let cachedSettings = null
let cacheExpiry = 0
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

router.get('/', async (req, res) => {
  try {
    const now = Date.now()

    // Serve from memory cache if still fresh
    if (cachedSettings && now < cacheExpiry) {
      res.setCache && res.setCache(60)
      return res.json({ success: true, settings: cachedSettings, fromCache: true })
    }

    let s = await SiteSettings.findOne({ key: 'main' })
      .select('-razorpayKeySecret -cloudinaryApiSecret -emailPass')
      .lean() // ✅ lean() = 3-5x faster, returns plain JS object

    if (!s) s = await SiteSettings.create({ key: 'main' })

    // Store in memory cache
    cachedSettings = s
    cacheExpiry = now + CACHE_TTL_MS

    // HTTP caching header — browser/nginx won't re-request for 60s
    res.setCache && res.setCache(60)
    res.json({ success: true, settings: s })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Called by admin when settings are updated — clears the cache
router.clearCache = () => {
  cachedSettings = null
  cacheExpiry = 0
}

module.exports = router
