'use strict'
const express  = require('express')
const router   = express.Router()
const mongoose = require('mongoose')
const Product  = require('../models/Product')
const { protect, optionalAuth } = require('../middleware/auth')

const isObjectId = (s) => mongoose.Types.ObjectId.isValid(s) && /^[0-9a-fA-F]{24}$/.test(s)

// Minimal fields — skip heavy fields like description, reviews, etc.
const LIST_FIELDS = 'name slug category subcategory material price salePrice images rating numReviews badge isFeatured isInStock icon totalSold'

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
const _cache = new Map()

function cacheGet(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) { _cache.delete(key); return null }
  return entry.data
}
function cacheSet(key, data, ttlMs) {
  // Serialize once here, send raw JSON string from cache = zero serialization overhead
  _cache.set(key, { data, raw: JSON.stringify({ success: true, ...data, fromCache: true }), expiry: Date.now() + ttlMs })
}
function invalidateProductCaches() {
  for (const key of _cache.keys()) {
    if (key.startsWith('prod:')) _cache.delete(key)
  }
}

// List view mein sirf main/first image bhejo — payload chhota raho
// Ab sab Cloudinary URLs hain, toh base64 strip karne ki zaroorat nahi
function processImagesForList(products) {
  return products.map(p => {
    if (!p.images || !p.images.length) return p
    const main = p.images.find(i => i.isMain) || p.images[0]
    return { ...p, images: main ? [{ url: main.url, alt: main.alt, isMain: true }] : [] }
  })
}

const TTL = {
  HOMEPAGE:   3 * 60 * 1000,   // 3 min
  LIST:       45 * 1000,        // 45 sec
  FEATURED:   3 * 60 * 1000,   // 3 min
  CATEGORIES: 10 * 60 * 1000,  // 10 min
}

// ─── WARM-UP: Pre-populate cache on startup ───────────────────────────────────
// Called from server.js after DB connects. Means FIRST user request is instant.
async function warmCache() {
  try {
    console.log('🔥 Warming product cache...')
    const t = Date.now()

    const [murtis, furniture, decor, murtiSubcats, featured, categories, temples] = await Promise.all([
      Product.find({ isActive: true, category: 'murtis' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'furniture' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'decor' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.distinct('subcategory', { isActive: true, category: 'murtis', subcategory: { $exists: true, $ne: '' } }),
      Product.find({ isActive: true, isFeatured: true }).limit(8).sort('-totalSold').select(LIST_FIELDS).lean(),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.find({ isActive: true, category: 'temples' })
        .sort('-isFeatured -totalSold').limit(4).select(LIST_FIELDS).lean(),
    ])

    const homepagePayload = {
      murtis:       processImagesForList(murtis),
      furniture:    processImagesForList(furniture),
      decor:        processImagesForList(decor),
      murtiSubcats,
      temples:      processImagesForList(temples),
    }

    cacheSet('prod:homepage', homepagePayload, TTL.HOMEPAGE)
    cacheSet('prod:featured',  { products: processImagesForList(featured) }, TTL.FEATURED)
    cacheSet('prod:categories', { categories }, TTL.CATEGORIES)

    // Also cache first-page default list
    const [total, allProducts] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }).sort('-createdAt').limit(12).select(LIST_FIELDS).lean(),
    ])
    cacheSet('prod:list::::-createdAt:1:12:::',
      { total, page: 1, pages: Math.ceil(total / 12), products: processImagesForList(allProducts) },
      TTL.LIST
    )

    console.log(`✅ Product cache warmed in ${Date.now() - t}ms`)
  } catch (err) {
    console.error('⚠️  Cache warm-up failed (non-fatal):', err.message)
  }
}

// ─── GET /api/products/homepage ───────────────────────────────────────────────
router.get('/homepage', async (req, res) => {
  try {
    const entry = _cache.get('prod:homepage')
    if (entry && Date.now() < entry.expiry) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360')
      res.setHeader('X-Cache', 'HIT')
      return res.end(entry.raw)
    }

    const [murtis, furniture, decor, murtiSubcats, temples] = await Promise.all([
      Product.find({ isActive: true, category: 'murtis' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'furniture' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'decor' })
        .sort('-isFeatured -totalSold').limit(8).select(LIST_FIELDS).lean(),
      Product.distinct('subcategory', { isActive: true, category: 'murtis', subcategory: { $exists: true, $ne: '' } }),
      Product.find({ isActive: true, category: 'temples' })
        .sort('-isFeatured -totalSold').limit(4).select(LIST_FIELDS).lean(),
    ])

    const payload = {
      murtis:       processImagesForList(murtis),
      furniture:    processImagesForList(furniture),
      decor:        processImagesForList(decor),
      murtiSubcats,
      temples:      processImagesForList(temples),
    }
    cacheSet('prod:homepage', payload, TTL.HOMEPAGE)
    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360')
    res.setHeader('X-Cache', 'MISS')
    res.json({ success: true, ...payload })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category = '', material = '', search = '',
      sort = '-createdAt',
      page = 1, limit = 12,
      minPrice = '', maxPrice = '', inStock = '',
    } = req.query

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, parseInt(limit) || 12)
    const skip     = (pageNum - 1) * limitNum

    // Cache key — search queries NOT cached
    const cacheKey = search
      ? null
      : `prod:list:${category}:${material}:${sort}:${pageNum}:${limitNum}:${minPrice}:${maxPrice}:${inStock}`

    if (cacheKey) {
      const entry = _cache.get(cacheKey)
      if (entry && Date.now() < entry.expiry) {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'public, max-age=45, stale-while-revalidate=90')
        res.setHeader('X-Cache', 'HIT')
        return res.end(entry.raw)
      }
    }

    const query = { isActive: true }
    if (category) query.category = category
    if (material) query.material = { $regex: material, $options: 'i' }
    if (inStock === 'true') query.isInStock = true
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    let sortObj = sort
    if (search && search.trim().length >= 2) {
      query.$text = { $search: search.trim() }
      sortObj = { score: { $meta: 'textScore' } }
    } else if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum).select(LIST_FIELDS).lean(),
    ])

    const payload = {
      total, page: pageNum,
      pages: Math.ceil(total / limitNum),
      products: processImagesForList(products),
    }

    if (cacheKey) {
      cacheSet(cacheKey, payload, TTL.LIST)
      res.setHeader('Cache-Control', 'public, max-age=45, stale-while-revalidate=90')
    }
    res.setHeader('X-Cache', 'MISS')
    res.json({ success: true, ...payload })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET /api/products/featured ───────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const entry = _cache.get('prod:featured')
    if (entry && Date.now() < entry.expiry) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'public, max-age=180')
      res.setHeader('X-Cache', 'HIT')
      return res.end(entry.raw)
    }
    const products = await Product.find({ isActive: true, isFeatured: true })
      .limit(8).sort('-totalSold').select(LIST_FIELDS).lean()
    cacheSet('prod:featured', { products: processImagesForList(products) }, TTL.FEATURED)
    res.setHeader('Cache-Control', 'public, max-age=180')
    res.setHeader('X-Cache', 'MISS')
    res.json({ success: true, products: processImagesForList(products) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET /api/products/categories ─────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const entry = _cache.get('prod:categories')
    if (entry && Date.now() < entry.expiry) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'public, max-age=600')
      res.setHeader('X-Cache', 'HIT')
      return res.end(entry.raw)
    }
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    cacheSet('prod:categories', { categories }, TTL.CATEGORIES)
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    const filter = isObjectId(id) ? { _id: id, isActive: true } : { slug: id, isActive: true }
    const product = await Product.findOne(filter).populate('reviews.user', 'firstName lastName avatar')
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    res.setHeader('Cache-Control', 'no-store')
    res.json({ success: true, product })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── POST /api/products/:id/reviews ──────────────────────────────────────────
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body
    if (!rating || !comment?.trim())
      return res.status(400).json({ success: false, message: 'Rating and comment are required' })
    const ratingNum = Number(rating)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    if (comment.trim().length < 5)
      return res.status(400).json({ success: false, message: 'Review must be at least 5 characters' })

    const filter = isObjectId(id) ? { _id: id } : { slug: id }
    const product = await Product.findOne({ ...filter, isActive: true })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    const already = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    if (already) return res.status(400).json({ success: false, message: 'You have already reviewed this product' })

    product.reviews.push({
      user: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      rating: ratingNum, comment: comment.trim(), isVerifiedPurchase: false,
    })
    product.calcRatings()
    await product.save()
    invalidateProductCaches()

    const savedReview = product.reviews[product.reviews.length - 1]
    res.status(201).json({ success: true, message: 'Review submitted successfully', review: savedReview, rating: product.rating, numReviews: product.numReviews })
  } catch (err) {
    console.error('Review submit error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
module.exports.invalidateProductCaches = invalidateProductCaches
module.exports.warmCache = warmCache
