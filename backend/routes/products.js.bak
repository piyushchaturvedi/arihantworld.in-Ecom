const express  = require('express')
const router   = express.Router()
const mongoose = require('mongoose')
const Product  = require('../models/Product')
const { protect, optionalAuth } = require('../middleware/auth')

const isObjectId = (s) => mongoose.Types.ObjectId.isValid(s) && /^[0-9a-fA-F]{24}$/.test(s)

// Shared select fields (minimal payload)
const LIST_FIELDS = 'name slug category subcategory material price salePrice images rating numReviews badge isFeatured isInStock icon'

// ─── In-memory cache for homepage (refreshes every 2 minutes) ────────────────
let homepageCache = null
let homepageCacheExpiry = 0
const HOMEPAGE_CACHE_MS = 2 * 60 * 1000 // 2 minutes

// GET /api/products/homepage  ← NEW: single endpoint, 3 parallel DB queries
// Returns exactly 4 products per category + subcategories for tab filter
router.get('/homepage', async (req, res) => {
  try {
    const now = Date.now()
    if (homepageCache && now < homepageCacheExpiry) {
      res.setCache && res.setCache(120)
      return res.json({ success: true, ...homepageCache, fromCache: true })
    }

    // 3 parallel DB queries — total time = slowest query, not sum of all
    const [murtis, furniture, decor] = await Promise.all([
      Product.find({ isActive: true, category: 'murtis' })
        .sort('-createdAt').limit(4)
        .select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'furniture' })
        .sort('-createdAt').limit(4)
        .select(LIST_FIELDS).lean(),
      Product.find({ isActive: true, category: 'decor' })
        .sort('-createdAt').limit(4)
        .select(LIST_FIELDS).lean(),
    ])

    // Also fetch subcategories for murti tabs (lightweight distinct)
    const murtiSubcats = await Product.distinct('subcategory', { isActive: true, category: 'murtis', subcategory: { $exists: true, $ne: null, $ne: '' } })

    const payload = { murtis, furniture, decor, murtiSubcats }
    homepageCache = payload
    homepageCacheExpiry = now + HOMEPAGE_CACHE_MS

    res.setCache && res.setCache(120)
    res.json({ success: true, ...payload })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, material, search, sort = '-createdAt', page = 1, limit = 12, minPrice, maxPrice, inStock } = req.query
    const query = { isActive: true }
    if (category) query.category = category
    if (material) query.material = { $regex: material, $options: 'i' }
    if (inStock === 'true') query.isInStock = true
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { material: { $regex: search, $options: 'i' } },
      ]
    }
    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, parseInt(limit) || 12)
    const skip     = (pageNum - 1) * limitNum

    // Parallel: count + find at same time
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sort).skip(skip).limit(limitNum)
        .select(LIST_FIELDS).lean(),
    ])

    if (!search) res.setCache && res.setCache(30)
    res.json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), products })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .limit(8).sort('-totalSold').select(LIST_FIELDS).lean()
    res.setCache && res.setCache(120)
    res.json({ success: true, products })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    res.setCache && res.setCache(300)
    res.json({ success: true, categories })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/products/:id  (ObjectId or slug)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    const filter = isObjectId(id) ? { _id: id, isActive: true } : { slug: id, isActive: true }
    const product = await Product.findOne(filter).populate('reviews.user', 'firstName lastName avatar')
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    // ✅ No public cache on product detail — reviews change dynamically
    res.noCache && res.noCache()
    res.json({ success: true, product })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/products/:id/reviews  (accepts ObjectId OR slug)
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body

    // Validate input
    if (!rating || !comment?.trim()) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' })
    }
    const ratingNum = Number(rating)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    }
    if (comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review must be at least 5 characters' })
    }

    // Find product by ObjectId OR slug — handles both cases robustly
    const filter = isObjectId(id) ? { _id: id } : { slug: id }
    const product = await Product.findOne({ ...filter, isActive: true })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    // Check duplicate review
    const already = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    if (already) return res.status(400).json({ success: false, message: 'You have already reviewed this product' })

    // Build review object
    const review = {
      user:    req.user._id,
      name:    `${req.user.firstName} ${req.user.lastName}`.trim(),
      rating:  ratingNum,
      comment: comment.trim(),
      isVerifiedPurchase: false, // TODO: check orders for verified badge
    }

    product.reviews.push(review)
    product.calcRatings()           // update rating + numReviews
    await product.save()

    // Return the newly created review so frontend can use real _id + createdAt
    const savedReview = product.reviews[product.reviews.length - 1]

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: savedReview,
      rating: product.rating,
      numReviews: product.numReviews,
    })
  } catch (err) {
    console.error('Review submit error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
