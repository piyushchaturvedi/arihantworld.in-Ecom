const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['Home','Office','Other'], default: 'Home' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
})

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true,'First name is required'], trim: true, maxlength: 50 },
  lastName: { type: String, required: [true,'Last name is required'], trim: true, maxlength: 50 },
  email: { type: String, required: [true,'Email is required'], unique: true, lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] },
  phone: { type: String, required: [true,'Phone is required'], trim: true },
  password: { type: String, required: [true,'Password is required'], minlength: 8, select: false },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  avatar: String,
  dob: Date,
  gender: { type: String, enum: ['Male','Female','Other','Prefer not to say'] },
  anniversary: Date,
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  loyaltyPoints: { type: Number, default: 0 },
  membershipTier: { type: String, enum: ['Bronze','Silver','Gold','Platinum'], default: 'Bronze' },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otpToken: String,
  otpExpire: Date,
  lastLogin: Date,
  notifications: {
    orderConfirmation: { type: Boolean, default: true },
    shippingUpdates: { type: Boolean, default: true },
    deliveryConfirmation: { type: Boolean, default: true },
    emailNewsletter: { type: Boolean, default: true },
    smsOffers: { type: Boolean, default: false },
    whatsappUpdates: { type: Boolean, default: true },
    loyaltyPoints: { type: Boolean, default: true },
    priceDrop: { type: Boolean, default: true },
    backInStock: { type: Boolean, default: false },
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual: full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Update membership tier based on points
userSchema.pre('save', function(next) {
  if (this.loyaltyPoints >= 5000) this.membershipTier = 'Platinum'
  else if (this.loyaltyPoints >= 2000) this.membershipTier = 'Gold'
  else if (this.loyaltyPoints >= 500) this.membershipTier = 'Silver'
  else this.membershipTier = 'Bronze'
  next()
})

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate JWT token
userSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
}

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex')
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000 // 15 minutes
  return resetToken
}

// Generate OTP
userSchema.methods.generateOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  this.otpToken = crypto.createHash('sha256').update(otp).digest('hex')
  this.otpExpire = Date.now() + 10 * 60 * 1000 // 10 minutes
  return otp
}

module.exports = mongoose.model('User', userSchema)
