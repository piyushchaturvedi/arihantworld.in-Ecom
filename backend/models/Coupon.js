const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: { type: String, enum: ['percentage','fixed'], required: true },
  value: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  userLimit: { type: Number, default: 1 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableCategories: [String],
  excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, usedAt: Date }],
}, { timestamps: true })

couponSchema.methods.isValid = function(orderTotal, userId) {
  const now = new Date()
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' }
  if (now < this.validFrom || now > this.validUntil) return { valid: false, message: 'Coupon has expired' }
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' }
  if (orderTotal < this.minOrderValue) return { valid: false, message: `Minimum order value ₹${this.minOrderValue} required` }
  const userUsage = this.usedBy.filter(u => u.user.toString() === userId.toString()).length
  if (userUsage >= this.userLimit) return { valid: false, message: 'You have already used this coupon' }
  return { valid: true }
}

couponSchema.methods.calculateDiscount = function(orderTotal) {
  let discount = this.type === 'percentage' ? (orderTotal * this.value) / 100 : this.value
  if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount)
  return Math.round(discount)
}

module.exports = mongoose.model('Coupon', couponSchema)
