const express = require('express')
const router = express.Router()
const Wallet = require('../models/Wallet')
const { protect } = require('../middleware/auth')

// GET my wallet
// GET /api/wallet/my
router.get('/my', protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id })
    if (!wallet) wallet = await Wallet.create({ user: req.user._id })
    await wallet.processExpiry()
    res.json({ success: true, wallet })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// User add money (create Razorpay order for wallet top-up)
router.post('/topup', protect, async (req, res) => {
  try {
    const { amount, expiresInDays } = req.body
    if (!amount || amount < 100) return res.status(400).json({ success: false, message: 'Minimum top-up is ₹100' })
    // In production: create Razorpay order
    // const Razorpay = require('razorpay')
    // const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    // const order = await rp.orders.create({ amount: amount * 100, currency: 'INR', receipt: `wallet-${req.user._id}` })
    // For demo: directly credit
    let wallet = await Wallet.findOne({ user: req.user._id })
    if (!wallet) wallet = await Wallet.create({ user: req.user._id })
    await wallet.credit(amount, 'Wallet top-up via UPI', 'demo-topup', 'user')
    res.json({ success: true, wallet, message: `₹${amount} added to your wallet` })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
