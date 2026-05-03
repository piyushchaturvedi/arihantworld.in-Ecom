const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const Wallet = require('../models/Wallet')
const sendEmail = require('../utils/sendEmail')
const { protect } = require('../middleware/auth')

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`

// GET /api/orders/my
router.get('/my', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const query = { user: req.user._id }
    if (status && status !== 'all') query.status = status
    const total = await Order.countDocuments(query)
    const orders = await Order.find(query).sort('-createdAt').skip((page-1)*limit).limit(Number(limit)).populate('items.product', 'name images slug category')
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total/limit), orders })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product', 'name images slug category')
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, order })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})

// POST /api/orders — create order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, payment, couponCode, notes, useWallet, walletAmount } = req.body

    // Validate items
    const validatedItems = []
    let subtotal = 0
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive) return res.status(400).json({ success: false, message: `Product not available` })
      const price = product.salePrice || product.price
      validatedItems.push({ product: product._id, name: product.name, image: product.images?.[0]?.url, price, originalPrice: product.price, qty: item.qty, variant: item.variant })
      subtotal += price * item.qty
    }

    // Coupon
    let couponDiscount = 0, couponCodeApplied = null
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })
      if (coupon) {
        const validity = coupon.isValid(subtotal, req.user._id)
        if (validity.valid) { couponDiscount = coupon.calculateDiscount(subtotal); couponCodeApplied = coupon.code }
      }
    }

    const afterDiscount = subtotal - couponDiscount
    const shipping = afterDiscount >= 25000 ? 0 : 350
    const gst = Math.round(afterDiscount * 0.18)
    let total = afterDiscount + shipping + gst

    // Wallet payment
    let walletPaid = 0
    if (useWallet && walletAmount > 0) {
      const wallet = await Wallet.findOne({ user: req.user._id })
      if (wallet && wallet.balance >= walletAmount) {
        walletPaid = Math.min(walletAmount, total)
        total = Math.max(0, total - walletPaid)
      }
    }

    const order = await Order.create({
      user: req.user._id, items: validatedItems, shippingAddress,
      pricing: { subtotal, discount: 0, couponDiscount, couponCode: couponCodeApplied, shipping, gst, total },
      payment: { method: payment?.method || 'razorpay' }, notes,
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedBy: 'system' }]
    })

    // Deduct wallet if used
    if (walletPaid > 0) {
      const wallet = await Wallet.findOne({ user: req.user._id })
      if (wallet) await wallet.debit(walletPaid, `Order ${order.orderNumber}`, order._id.toString(), 'user')
    }

    // Update stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty, totalSold: item.qty } })
    }

    // Mark coupon used
    if (couponCodeApplied) {
      await Coupon.findOneAndUpdate({ code: couponCodeApplied }, { $inc: { usedCount: 1 }, $push: { usedBy: { user: req.user._id, usedAt: new Date() } } })
    }

    res.status(201).json({ success: true, order })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/orders/:id/payment — initiate Razorpay
router.post('/:id/payment', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
      // Demo mode
      return res.json({ success: true, demo: true, orderId: order._id, orderNumber: order.orderNumber, amount: order.pricing.total * 100, message: 'Demo mode — configure Razorpay keys' })
    }

    const Razorpay = require('razorpay')
    const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    const rpOrder = await rp.orders.create({ amount: Math.round(order.pricing.total * 100), currency: 'INR', receipt: order.orderNumber })
    order.payment.razorpayOrderId = rpOrder.id
    await order.save()
    res.json({ success: true, razorpayOrderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, key: process.env.RAZORPAY_KEY_ID, orderNumber: order.orderNumber })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/orders/verify-payment
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body
    let order

    if (razorpaySignature && process.env.RAZORPAY_KEY_SECRET) {
      const crypto = require('crypto')
      const sign = razorpayOrderId + '|' + razorpayPaymentId
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex')
      if (expected !== razorpaySignature) {
        // Send payment failed email
        order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId }).populate('user', 'firstName email')
        if (order?.user?.email) {
          sendEmail({ to: order.user.email, templateSlug: 'payment_failed', variables: { customerName: order.user.firstName, orderNumber: order.orderNumber, failureReason: 'Invalid payment signature' } }).catch(()=>{})
        }
        return res.status(400).json({ success: false, message: 'Invalid payment signature' })
      }
      order = await Order.findOneAndUpdate({ 'payment.razorpayOrderId': razorpayOrderId }, { $set: { status: 'confirmed', 'payment.status': 'paid', 'payment.razorpayPaymentId': razorpayPaymentId, 'payment.razorpaySignature': razorpaySignature, 'payment.paidAt': new Date() }, $push: { statusHistory: { status: 'confirmed', note: 'Payment successful', updatedBy: 'system' } } }, { new: true }).populate('user', 'firstName lastName email')
    } else {
      // Demo / COD
      order = await Order.findByIdAndUpdate(orderId || req.body.orderId, { $set: { status: 'confirmed', 'payment.status': payment?.method === 'cod' ? 'pending' : 'paid', 'payment.paidAt': new Date() }, $push: { statusHistory: { status: 'confirmed', note: 'Order confirmed', updatedBy: 'system' } } }, { new: true }).populate('user', 'firstName lastName email')
    }

    if (order) {
      // Award loyalty points
      const pts = Math.floor(order.pricing.total / 100)
      await User.findByIdAndUpdate(order.user._id || order.user, { $inc: { loyaltyPoints: pts } })

      // Send confirmation email
      if (order.user?.email) {
        const itemsHtml = order.items?.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmt(i.price * i.qty)}</td></tr>`).join('') || ''
        sendEmail({
          to: order.user.email, templateSlug: 'order_confirmed',
          variables: {
            customerName: order.user.firstName,
            orderNumber: order.orderNumber,
            total: fmt(order.pricing.total),
            paymentMethod: order.payment.method,
            address: `${order.shippingAddress?.line1}, ${order.shippingAddress?.city}`,
            items: itemsHtml ? `<table class="ot"><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>` : '',
            estimatedDelivery: '7-14 business days'
          }
        }).catch(()=>{})
      }
    }

    res.json({ success: true, message: 'Payment verified', order })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    if (!['pending','confirmed'].includes(order.status)) return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' })
    order.status = 'cancelled'
    order.cancelReason = req.body.reason || 'Customer cancelled'
    order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Customer cancelled', updatedBy: req.user._id.toString() })
    await order.save()
    res.json({ success: true, message: 'Order cancelled', order })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})

// POST /api/cart/coupon
router.post('/coupon/validate', protect, async (req, res) => {
  try {
    const { code, orderTotal } = req.body
    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' })
    const validity = coupon.isValid(orderTotal, req.user._id)
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message })
    const discount = coupon.calculateDiscount(orderTotal)
    res.json({ success: true, discount, type: coupon.type, value: coupon.value, code: coupon.code })
  } catch { res.status(500).json({ success: false, message: 'Failed' }) }
})


// GET /api/orders/:id/invoice — returns HTML invoice
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('user','firstName lastName email phone')
    if (!order) return res.status(404).json({ success:false, message:'Order not found' })
    const SiteSettings = require('../models/SiteSettings')
    const { generateInvoiceHTML } = require('../utils/generateInvoice')
    const settings = await SiteSettings.findOne({ key:'main' }) || {}
    const html = generateInvoiceHTML(order, settings)
    res.setHeader('Content-Type','text/html')
    res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.html"`)
    res.send(html)
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})

// Helper: send order emails
async function sendOrderEmails(type, order, user) {
  try {
    const sendEmail = require('../utils/sendEmail')
    const customer = { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }
    if (type === 'confirmed') {
      await sendEmail.sendEmail(sendEmail.templates.orderConfirmed({ order, customer }))
      await sendEmail.sendEmail(sendEmail.templates.adminNewOrder({ order, customer }))
    } else if (type === 'shipped') {
      await sendEmail.sendEmail(sendEmail.templates.orderShipped({ order, customer, tracking: order.tracking }))
    } else if (type === 'delivered') {
      await sendEmail.sendEmail(sendEmail.templates.orderDelivered({ order, customer }))
    }
  } catch(err) { console.error('Email error:', err.message) }
}

module.exports = router
