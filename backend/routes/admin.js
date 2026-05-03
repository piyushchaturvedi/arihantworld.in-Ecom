const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const Wallet = require('../models/Wallet')
const EmailTemplate = require('../models/EmailTemplate')
const SiteSettings = require('../models/SiteSettings')
const ConsultationRequest = require('../models/ConsultationRequest')
const { protect, adminOnly } = require('../middleware/auth')
const sendEmail = require('../utils/sendEmail')
const { uploadImage, uploadImages, deleteFromCloudinary, cloudinaryConfigured } = require('../utils/imageUpload')
const multer = require('multer')

router.use(protect, adminOnly)

// Multer — store in memory, upload utility handles the rest
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  }
})
const uploadMany = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  }
})

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const [totalOrders, monthOrders, lastMonthOrders, totalRevenue, monthRevenue, totalUsers, monthUsers, totalProducts, lowStockProducts, recentOrders, ordersByStatus, topProducts] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.aggregate([{ $match: { 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      Order.aggregate([{ $match: { 'payment.status': 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
      Order.find().sort('-createdAt').limit(8).populate('user', 'firstName lastName email'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.find({ isActive: true }).sort('-totalSold').limit(5).select('name category totalSold price salePrice images'),
    ])
    res.json({ success: true, stats: { totalOrders, monthOrders, lastMonthOrders, totalRevenue: totalRevenue[0]?.total || 0, monthRevenue: monthRevenue[0]?.total || 0, totalUsers, monthUsers, totalProducts, lowStockProducts }, recentOrders, ordersByStatus, topProducts })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// PRODUCTS
// ────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { page=1, limit=20, category, search, isActive } = req.query
    const query = {}
    if (category && category !== 'all') query.category = category
    if (isActive !== undefined) query.isActive = isActive === 'true'
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
    const total = await Product.countDocuments(query)
    const products = await Product.find(query).sort('-createdAt').skip((page-1)*limit).limit(Number(limit))
    res.json({ success: true, total, pages: Math.ceil(total/limit), page: Number(page), products })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/products', async (req, res) => {
  try {
    // images come as JSON array from frontend (already base64 or URLs)
    const product = await Product.create(req.body)
    res.status(201).json({ success: true, product })
  } catch(err) { res.status(400).json({ success: false, message: err.message }) }
})

router.put('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' })
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    res.json({ success: true, product })
  } catch(err) { res.status(400).json({ success: false, message: err.message }) }
})

router.delete('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' })
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ success: true, message: 'Product deactivated' })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})

// ── Image Upload Route (multipart) ──────────────────────────
// POST /api/admin/products/upload-images
// Accepts: multipart/form-data with field "images" (up to 8 files)
// Returns: array of uploaded image URLs
router.post('/products/upload-images', uploadMany.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' })
    }
    const uploaded = await uploadImages(req.files, 'arihant-world/products')
    const urls = uploaded.map(u => u.url)
    const storage = cloudinaryConfigured() ? 'cloudinary' : 'base64'
    res.json({
      success: true, urls, storage,
      message: storage === 'cloudinary'
        ? `${urls.length} image(s) uploaded to Cloudinary`
        : `${urls.length} image(s) stored as base64. Add CLOUDINARY env vars for permanent storage.`
    })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// Single image upload
router.post('/products/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const result = await uploadImage(req.file.buffer, req.file.mimetype, 'arihant-world/products')
    res.json({ success: true, url: result.url, storage: result.storage })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { page=1, limit=20, status, search, startDate, endDate } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status
    if (search) query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }]
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(startDate); if (endDate) query.createdAt.$lte = new Date(endDate) }
    const total = await Order.countDocuments(query)
    const orders = await Order.find(query).sort('-createdAt').skip((page-1)*limit).limit(Number(limit)).populate('user', 'firstName lastName email phone')
    res.json({ success: true, total, pages: Math.ceil(total/limit), page: Number(page), orders })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone').populate('items.product', 'name images category')
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, order })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note, tracking } = req.body
    const update = { status, $push: { statusHistory: { status, note: note || `Status updated to ${status}`, updatedBy: req.user.firstName } } }
    if (tracking) update.tracking = tracking
    if (status === 'delivered') update['tracking.deliveredAt'] = new Date()
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'firstName lastName email phone')
    if (!order) return res.status(404).json({ success: false, message: 'Not found' })

    // Send status emails (non-blocking)
    if (order.user?.email) {
      const sendEmail = require('../utils/sendEmail')
      const customer = { firstName: order.user.firstName, lastName: order.user.lastName, email: order.user.email, phone: order.user.phone }
      if (status === 'shipped') sendEmail.sendEmail(sendEmail.templates.orderShipped({ order, customer, tracking: order.tracking })).catch(()=>{})
      if (status === 'delivered') sendEmail.sendEmail(sendEmail.templates.orderDelivered({ order, customer })).catch(()=>{})
    }

    res.json({ success: true, order })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// USERS
// ────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page=1, limit=20, search, role } = req.query
    const query = {}
    if (role) query.role = role
    if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    const total = await User.countDocuments(query)
    const users = await User.find(query).sort('-createdAt').skip((page-1)*limit).limit(Number(limit)).select('-password')
    res.json({ success: true, total, pages: Math.ceil(total/limit), users })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    const orders = await Order.find({ user: req.params.id }).sort('-createdAt').limit(10)
    const wallet = await Wallet.findOne({ user: req.params.id })
    res.json({ success: true, user, orders, wallet })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})

router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' })
    const user = await User.create({ firstName, lastName, email, phone, password: password || 'Admin@123456', role: role || 'user', isEmailVerified: true })
    await Wallet.create({ user: user._id })
    res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } })
  } catch(err) { res.status(400).json({ success: false, message: err.message }) }
})

router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['role','isActive','loyaltyPoints','membershipTier','firstName','lastName','phone']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, user })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// WALLET (ADMIN)
// ────────────────────────────────────────────────────────────
router.get('/wallet/:userId', async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.params.userId })
    if (!wallet) wallet = await Wallet.create({ user: req.params.userId })
    res.json({ success: true, wallet })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/wallet/:userId/credit', async (req, res) => {
  try {
    const { amount, description, reference } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' })
    let wallet = await Wallet.findOne({ user: req.params.userId })
    if (!wallet) wallet = await Wallet.create({ user: req.params.userId })
    await wallet.credit(Number(amount), description || 'Admin credit', reference || '', req.user.email)
    res.json({ success: true, wallet, message: `₹${amount} credited` })
  } catch(err) { res.status(400).json({ success: false, message: err.message }) }
})

router.post('/wallet/:userId/debit', async (req, res) => {
  try {
    const { amount, description, reference } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' })
    let wallet = await Wallet.findOne({ user: req.params.userId })
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' })
    await wallet.debit(Number(amount), description || 'Admin debit', reference || '', req.user.email)
    res.json({ success: true, wallet, message: `₹${amount} debited` })
  } catch(err) { res.status(400).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// COUPONS
// ────────────────────────────────────────────────────────────
router.get('/coupons', async (req, res) => { try { res.json({ success: true, coupons: await Coupon.find().sort('-createdAt') }) } catch { res.status(500).json({ success: false, message: 'Failed' }) } })
router.post('/coupons', async (req, res) => { try { res.status(201).json({ success: true, coupon: await Coupon.create(req.body) }) } catch(err) { res.status(400).json({ success: false, message: err.message }) } })
router.put('/coupons/:id', async (req, res) => { try { const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!c) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, coupon: c }) } catch(err) { res.status(400).json({ success: false, message: err.message }) } })
router.delete('/coupons/:id', async (req, res) => { try { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }) } catch { res.status(500).json({ success: false, message: 'Failed' }) } })

// ────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ────────────────────────────────────────────────────────────
router.get('/email-templates', async (req, res) => { try { res.json({ success: true, templates: await EmailTemplate.find().sort('name') }) } catch { res.status(500).json({ success: false, message: 'Failed' }) } })
router.get('/email-templates/:id', async (req, res) => { try { const t = await EmailTemplate.findById(req.params.id); if (!t) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, template: t }) } catch { res.status(500).json({ success: false, message: 'Failed' }) } })
router.post('/email-templates', async (req, res) => { try { req.body.lastModifiedBy = req.user.email; res.status(201).json({ success: true, template: await EmailTemplate.create(req.body) }) } catch(err) { res.status(400).json({ success: false, message: err.message }) } })
router.put('/email-templates/:id', async (req, res) => { try { req.body.lastModifiedBy = req.user.email; const t = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!t) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, template: t }) } catch(err) { res.status(400).json({ success: false, message: err.message }) } })
router.delete('/email-templates/:id', async (req, res) => { try { await EmailTemplate.findByIdAndDelete(req.params.id); res.json({ success: true }) } catch { res.status(500).json({ success: false, message: 'Failed' }) } })
router.post('/email-templates/test', async (req, res) => {
  try {
    const { to, templateSlug, variables } = req.body
    await sendEmail({ to: to || req.user.email, templateSlug, variables })
    res.json({ success: true, message: `Test email sent to ${to || req.user.email}` })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// SITE SETTINGS
// ────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    let s = await SiteSettings.findOne({ key: 'main' })
    if (!s) s = await SiteSettings.create({ key: 'main' })
    res.json({ success: true, settings: s })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.put('/settings', async (req, res) => {
  try {
    const s = await SiteSettings.findOneAndUpdate({ key: 'main' }, req.body, { new: true, upsert: true, runValidators: false })
    res.json({ success: true, settings: s, message: 'Settings saved' })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/settings/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const result = await uploadImage(req.file.buffer, req.file.mimetype, 'arihant-world/logos')
    await SiteSettings.findOneAndUpdate({ key: 'main' }, { logoUrl: result.url }, { upsert: true })
    res.json({ success: true, logoUrl: result.url, storage: result.storage, message: result.note || `Logo uploaded via ${result.storage}` })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// ────────────────────────────────────────────────────────────
// CONSULTATIONS
// ────────────────────────────────────────────────────────────
router.get('/consultations', async (req, res) => {
  try {
    const { page=1, limit=20, status } = req.query
    const query = status ? { status } : {}
    const total = await ConsultationRequest.countDocuments(query)
    const consultations = await ConsultationRequest.find(query).sort('-createdAt').skip((page-1)*limit).limit(Number(limit))
    res.json({ success: true, total, consultations })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

router.put('/consultations/:id', async (req, res) => {
  try {
    const c = await ConsultationRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, consultation: c })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// Analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query
    const fmt = period === 'daily' ? '%Y-%m-%d' : '%Y-%m'
    const data = await Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 12 }
    ])
    res.json({ success: true, data })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})


// GET /api/admin/orders/:id/invoice
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const Order = require('../models/Order')
    const SiteSettings = require('../models/SiteSettings')
    const { generateInvoiceHTML } = require('../utils/generateInvoice')
    const order = await Order.findById(req.params.id)
      .populate('user','firstName lastName email phone')
    if (!order) return res.status(404).json({ success:false, message:'Order not found' })
    const settings = await SiteSettings.findOne({ key:'main' }) || {}
    const html = generateInvoiceHTML(order, settings)
    res.setHeader('Content-Type','text/html')
    res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.html"`)
    res.send(html)
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})


// PUT /api/admin/users/:id/change-password — admin changes any user's password
router.put('/users/:id/change-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ success:false, message:'Password must be at least 8 characters' })
    const user = await User.findById(req.params.id).select('+password')
    if (!user) return res.status(404).json({ success:false, message:'User not found' })
    user.password = newPassword
    await user.save()
    res.json({ success:true, message:'Password updated successfully' })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

// PUT /api/admin/change-own-password — admin changes their own password
router.put('/change-own-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ success:false, message:'New password must be at least 8 characters' })
    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return res.status(400).json({ success:false, message:'Current password is incorrect' })
    user.password = newPassword
    await user.save()
    res.json({ success:true, message:'Your password updated successfully' })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

module.exports = router
