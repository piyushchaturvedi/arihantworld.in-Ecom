const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  variant: String,
})

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponCode: String,
    shipping: { type: Number, default: 0 },
    gst: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  payment: {
    method: { type: String, enum: ['razorpay','cod','bank'], default: 'razorpay' },
    status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','return_requested','returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],
  tracking: {
    carrier: String,
    awbNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
  },
  notes: String,        // Customer notes
  adminNotes: String,   // Internal notes
  cancelReason: String,
  isCustomOrder: { type: Boolean, default: false },
  craftingProgress: { type: Number, default: 0, min: 0, max: 100 },
  invoiceUrl: String,
  loyaltyPointsEarned: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
})

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear()
    const count = await this.constructor.countDocuments({ createdAt: { $gte: new Date(`${year}-01-01`) } })
    this.orderNumber = `AW-${year}-${String(count + 1).padStart(3, '0')}`
  }
  // Calculate loyalty points (1 point per ₹100 spent)
  if (this.payment.status === 'paid' && !this.loyaltyPointsEarned) {
    this.loyaltyPointsEarned = Math.floor(this.pricing.total / 100)
  }
  next()
})

orderSchema.index({ user: 1, status: 1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
