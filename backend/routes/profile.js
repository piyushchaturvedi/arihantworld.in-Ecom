const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Product = require('../models/Product')
const { protect } = require('../middleware/auth')

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug price salePrice images category badge')
    res.json({ success: true, user })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' })
  }
})

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','phone','dob','gender','anniversary','notifications']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ success: true, user })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// PUT /api/profile/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Password updated successfully' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update password' })
  }
})

// ===== ADDRESSES =====

// GET /api/profile/addresses
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses')
    res.json({ success: true, addresses: user.addresses })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' })
  }
})

// POST /api/profile/addresses
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    // If first address or isDefault set, clear other defaults
    if (req.body.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => { a.isDefault = false })
      req.body.isDefault = true
    }
    user.addresses.push(req.body)
    await user.save()
    res.status(201).json({ success: true, addresses: user.addresses })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// PUT /api/profile/addresses/:addressId
router.put('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const address = user.addresses.id(req.params.addressId)
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' })
    if (req.body.isDefault) user.addresses.forEach(a => { a.isDefault = false })
    Object.assign(address, req.body)
    await user.save()
    res.json({ success: true, addresses: user.addresses })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// DELETE /api/profile/addresses/:addressId
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId)
    await user.save()
    res.json({ success: true, addresses: user.addresses })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete address' })
  }
})

// ===== WISHLIST =====

// GET /api/profile/wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug price salePrice images category badge isInStock rating')
    res.json({ success: true, wishlist: user.wishlist })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' })
  }
})

// POST /api/profile/wishlist
router.post('/wishlist', protect, async (req, res) => {
  try {
    const { productId } = req.body
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: productId } })
    res.json({ success: true, message: 'Added to wishlist' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update wishlist' })
  }
})

// DELETE /api/profile/wishlist/:productId
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } })
    res.json({ success: true, message: 'Removed from wishlist' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update wishlist' })
  }
})

module.exports = router
