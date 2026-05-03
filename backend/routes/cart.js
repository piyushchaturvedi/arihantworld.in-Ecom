const express = require('express')
const router = express.Router()
const Coupon = require('../models/Coupon')
const { protect } = require('../middleware/auth')

// POST /api/cart/coupon — validate & apply coupon
router.post('/coupon', protect, async (req, res) => {
  try {
    const { code, orderTotal } = req.body
    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' })
    const validity = coupon.isValid(orderTotal || 0, req.user._id)
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message })
    const discount = coupon.calculateDiscount(orderTotal || 0)
    res.json({ success: true, discount, type: coupon.type, value: coupon.value, code: coupon.code, description: coupon.description })
  } catch {
    res.status(500).json({ success: false, message: 'Coupon validation failed' })
  }
})

// DELETE /api/cart/coupon
router.delete('/coupon', protect, (req, res) => {
  res.json({ success: true, message: 'Coupon removed' })
})

module.exports = router
