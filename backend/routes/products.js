const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Product = require('../models/Product')
const { protect, optionalAuth } = require('../middleware/auth')

// Helper: safely check if string is valid ObjectId
const isObjectId = (str) => mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str)

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
    const total = await Product.countDocuments(query)
    const pageNum = Math.max(1, parseInt(req.query.page) || 1)
    const limitNum = Math.min(100, parseInt(req.query.limit) || 12) // max limit control

    const skip = (pageNum - 1) * limitNum

    const products = await Product.find(query)
      .sort(sort).skip(skip).limit(limitNum)
      .select('name slug category material price salePrice images rating numReviews badge isFeatured isInStock')
    res.json({ success:true, total, page:Number(page), pages:Math.ceil(total/limit), products })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

// GET /api/products/featured  ← must be BEFORE /:id
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive:true, isFeatured:true })
      .limit(8).sort('-totalSold')
      .select('name slug category material price salePrice images rating numReviews badge isInStock')
    res.json({ success:true, products })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

// GET /api/products/categories  ← must be BEFORE /:id
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive:true } },
      { $group: { _id:'$category', count:{ $sum:1 } } },
      { $sort: { count:-1 } }
    ])
    res.json({ success:true, categories })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

// GET /api/products/:id — accepts ObjectId OR slug
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    let product

    if (isObjectId(id)) {
      // Valid MongoDB ObjectId → find by _id
      product = await Product.findOne({ _id: id, isActive: true })
        .populate('reviews.user', 'firstName lastName avatar')
    } else {
      // Not an ObjectId → treat as slug
      product = await Product.findOne({ slug: id, isActive: true })
        .populate('reviews.user', 'firstName lastName avatar')
    }

    if (!product) return res.status(404).json({ success:false, message:'Product not found' })
    res.json({ success:true, product })
  } catch(err) {
    // Catch any remaining cast errors gracefully
    res.status(500).json({ success:false, message: err.message })
  }
})

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid product ID' })
    const { rating, comment } = req.body
    if (!rating || !comment) return res.status(400).json({ success:false, message:'Rating and comment are required' })
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ success:false, message:'Product not found' })
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    if (alreadyReviewed) return res.status(400).json({ success:false, message:'You have already reviewed this product' })
    product.reviews.push({ user: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, rating: Number(rating), comment })
    if (typeof product.calcRatings === 'function') product.calcRatings()
    await product.save()
    res.status(201).json({ success:true, message:'Review added successfully' })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

module.exports = router
