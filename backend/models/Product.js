'use strict'
const mongoose = require('mongoose')
const slugify  = require('slugify')

const reviewSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:               { type: String, required: true },
  rating:             { type: Number, required: true, min: 1, max: 5 },
  comment:            { type: String, required: true, maxlength: 5000 },
  images:             [String],
  isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true })

const productSchema = new mongoose.Schema({
  name:             { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200 },
  slug:             { type: String, unique: true },
  description:      { type: String, required: [true, 'Description is required'] },
  shortDescription: { type: String, maxlength: 300 },
  category: {
    type:      String,
    required:  true,
    enum:      ['murtis', 'temples', 'furniture', 'decor', 'fountains', 'custom'],
    lowercase: true,
  },
  subcategory:  String,
  price:        { type: Number, required: true, min: 0 },
  salePrice:    { type: Number, min: 0, default: null },
  sku:          { type: String, unique: true, sparse: true },
  stock:        { type: Number, default: 0, min: 0 },
  isInStock:    { type: Boolean, default: true },
  isCustom:     { type: Boolean, default: false },
  // Images: only store URLs (Cloudinary/CDN), NOT base64.
  // Base64 in DB = massive documents = slow queries = 45+ sec response times.
  images:       [{ url: String, alt: String, isMain: { type: Boolean, default: false } }],
  dimensions:   { height: String, width: String, depth: String, weight: String },
  material:     { type: String, default: 'Makrana Marble' },
  sizes:        { type: [String], default: [] },
  sizeVariants: [{ size: String, price: Number, salePrice: Number, stock: Number }],
  finish:       [String],
  colors:       [String],
  tags:         [String],
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  badge:        { type: String, enum: ['Bestseller', 'New', 'Custom', 'Exclusive', 'Sale', null], default: null },
  icon:         { type: String, default: '🏺' },
  craftingDays: { type: Number, default: 7 },
  reviews:      [reviewSchema],
  rating:       { type: Number, default: 0 },
  numReviews:   { type: Number, default: 0 },
  totalSold:    { type: Number, default: 0 },
  metaTitle:       String,
  metaDescription: String,
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
})

// ─── Virtual ──────────────────────────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (this.salePrice && this.salePrice < this.price)
    return Math.round(((this.price - this.salePrice) / this.price) * 100)
  return 0
})

// ─── Auto-generate slug ───────────────────────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name'))
    this.slug = slugify(this.name, { lower: true, strict: true })
  next()
})

// ─── Rating recalculation ─────────────────────────────────────────────────────
productSchema.methods.calcRatings = function () {
  if (!this.reviews.length) {
    this.rating = 0; this.numReviews = 0
  } else {
    this.rating     = this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length
    this.numReviews = this.reviews.length
  }
}

// ─── Indexes — CRITICAL for query speed ──────────────────────────────────────
// Full-text search on name, description, tags
productSchema.index({ name: 'text', description: 'text', tags: 'text' })

// Core list query: isActive + category + sort by date
productSchema.index({ isActive: 1, category: 1, createdAt: -1 })
// Featured + bestseller sort
productSchema.index({ isActive: 1, isFeatured: 1, totalSold: -1 })
// inStock filter
productSchema.index({ isActive: 1, isInStock: 1, createdAt: -1 })
// Price range sort
productSchema.index({ isActive: 1, price: 1 })
// Bestseller sort
productSchema.index({ isActive: 1, totalSold: -1 })
// Slug lookup (detail page)
productSchema.index({ slug: 1 })

module.exports = mongoose.model('Product', productSchema)
