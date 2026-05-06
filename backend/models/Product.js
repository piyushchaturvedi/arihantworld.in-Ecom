const mongoose = require('mongoose')
const slugify = require('slugify')

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 5000 },
  images: [String],
  isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true })

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true,'Product name is required'], trim: true, maxlength: 200 },
  slug: { type: String, unique: true },
  description: { type: String, required: [true,'Description is required'] },
  shortDescription: { type: String, maxlength: 300 },
  category: {
    type: String,
    required: true,
    enum: ['murtis','temples','furniture','decor','fountains','custom'],
    lowercase: true
  },
  subcategory: String,
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0, default: null },
  sku: { type: String, unique: true, sparse: true },
  stock: { type: Number, default: 0, min: 0 },
  isInStock: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },
  images: [{ url: String, alt: String, isMain: { type: Boolean, default: false } }],
  dimensions: {
    height: String, width: String, depth: String, weight: String
  },
  material: { type: String, default: 'Makrana Marble' },
  sizes: { type: [String], default: [] },
  sizeVariants: [{ size: String, price: Number, salePrice: Number, stock: Number }],
  finish: [String],
  colors: [String],
  tags: [String],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  badge: { type: String, enum: ['Bestseller','New','Custom','Exclusive','Sale',null], default: null },
  craftingDays: { type: Number, default: 7 }, // days to craft
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual: discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.salePrice && this.salePrice < this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100)
  }
  return 0
})

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
  next()
})

// Calculate average rating after review update
productSchema.methods.calcRatings = function() {
  if (this.reviews.length === 0) {
    this.rating = 0
    this.numReviews = 0
  } else {
    this.rating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length
    this.numReviews = this.reviews.length
  }
}

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' })
productSchema.index({ category: 1, isActive: 1, isFeatured: 1 })
productSchema.index({ price: 1 })

module.exports = mongoose.model('Product', productSchema)
