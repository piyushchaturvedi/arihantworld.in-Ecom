const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect routes — require login
exports.protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, please login' })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account has been deactivated' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' })
  }
}

// Admin only
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied — Admin only' })
  }
  next()
}

// Optional auth (attach user if token present, continue either way)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    }
  } catch {}
  next()
}
