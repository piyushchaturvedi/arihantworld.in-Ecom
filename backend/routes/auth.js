const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const User = require('../models/User')
const Wallet = require('../models/Wallet')
const { protect } = require('../middleware/auth')
const sendEmail = require('../utils/sendEmail')

const sendToken = (user, code, res) => {
  const token = user.getSignedToken()
  const u = { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, loyaltyPoints: user.loyaltyPoints, membershipTier: user.membershipTier }
  res.status(code).json({ success: true, token, user: u })
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' })
    const user = await User.create({ firstName, lastName, email, phone, password })
    // Create wallet
    await Wallet.create({ user: user._id })
    // Send welcome email
    sendEmail({ to: email, templateSlug: 'welcome', variables: { customerName: firstName } }).catch(()=>{})
    sendToken(user, 201, res)
  } catch(err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map(e=>e.message).join(', ') })
    res.status(500).json({ success: false, message: 'Registration failed' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' })
    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' })
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' })
    if (!(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' })
    user.lastLogin = Date.now()
    await user.save({ validateBeforeSave: false })
    sendToken(user, 200, res)
  } catch { res.status(500).json({ success: false, message: 'Login failed' }) }
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => res.json({ success: true, user: req.user }))

// POST /api/auth/logout
router.post('/logout', protect, (req, res) => res.json({ success: true, message: 'Logged out' }))

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(404).json({ success: false, message: 'No account with this email' })
    const otp = user.generateOtp()
    await user.save({ validateBeforeSave: false })
    try {
      await sendEmail({ to: user.email, templateSlug: 'forgot_password', variables: { customerName: user.firstName, otp } })
      res.json({ success: true, message: `OTP sent to ${user.email}` })
    } catch(e) {
      user.otpToken = undefined; user.otpExpire = undefined
      await user.save({ validateBeforeSave: false })
      res.status(500).json({ success: false, message: 'Failed to send OTP email. Check email config.' })
    }
  } catch { res.status(500).json({ success: false, message: 'Something went wrong' }) }
})

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    const hashed = crypto.createHash('sha256').update(otp).digest('hex')
    const user = await User.findOne({ email, otpToken: hashed, otpExpire: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    res.json({ success: true, message: 'OTP verified' })
  } catch { res.status(500).json({ success: false, message: 'Verification failed' }) }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body
    const hashed = crypto.createHash('sha256').update(otp).digest('hex')
    const user = await User.findOne({ email, otpToken: hashed, otpExpire: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    user.password = newPassword
    user.otpToken = undefined; user.otpExpire = undefined
    await user.save()
    sendToken(user, 200, res)
  } catch { res.status(500).json({ success: false, message: 'Reset failed' }) }
})

module.exports = router
