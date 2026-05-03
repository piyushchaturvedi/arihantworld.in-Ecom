require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Product = require('../models/Product')
const Coupon = require('../models/Coupon')
const Wallet = require('../models/Wallet')
const EmailTemplate = require('../models/EmailTemplate')
const SiteSettings = require('../models/SiteSettings')

const DEFAULT_EMAIL_TEMPLATES = [
  { name:'Order Confirmed', slug:'order_confirmed', subject:'Order Confirmed #{{orderNumber}} — Arihant World', variables:['customerName','orderNumber','total','paymentMethod','address','items','estimatedDelivery'],
    body:'<h2>Thank you, {{customerName}}! 🙏</h2><p>Your order <strong>#{{orderNumber}}</strong> has been confirmed.</p><div style="background:#f7f2eb;border-left:4px solid #b8973a;padding:16px;margin:16px 0;"><strong>Total: {{total}}</strong> | Payment: {{paymentMethod}}</div>{{items}}<p>Delivery Address: {{address}}</p><p>Estimated Delivery: <strong>{{estimatedDelivery}}</strong></p>' },
  { name:'Payment Failed', slug:'payment_failed', subject:'Payment Failed — Order #{{orderNumber}} | Arihant World', variables:['customerName','orderNumber','failureReason'],
    body:'<h2>Payment Issue, {{customerName}}</h2><p>Your payment for order <strong>#{{orderNumber}}</strong> could not be processed.</p><p>Reason: <strong style="color:#dc2626;">{{failureReason}}</strong></p><p>Please try again with a different payment method.</p>' },
  { name:'Forgot Password OTP', slug:'forgot_password', subject:'Password Reset OTP — Arihant World', variables:['customerName','otp'],
    body:'<h2>Reset Your Password</h2><p>Hello {{customerName}}, your OTP is:</p><div style="text-align:center;padding:24px;background:#f7f2eb;border:1px solid #e8dfd0;margin:20px 0;"><span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#b8973a;font-family:monospace;">{{otp}}</span><p style="font-size:12px;color:#5c4a35;margin-top:8px;">Valid for 10 minutes only</p></div>' },
  { name:'Welcome Email', slug:'welcome', subject:'Welcome to Arihant World, {{customerName}}!', variables:['customerName'],
    body:'<h2>Welcome, {{customerName}}! 🙏</h2><p>Thank you for joining Arihant World — premium marble artistry since 1985.</p><div style="background:#f7f2eb;border-left:4px solid #b8973a;padding:16px;margin:16px 0;"><strong>Your Welcome Gift:</strong><br/>Use code <strong>WELCOME500</strong> to get ₹500 off your first order!</div>' },
  { name:'Consultation Confirmation', slug:'consultation_request', subject:'Consultation Request Received — Arihant World', variables:['customerName','budget','preferredTime','requirements'],
    body:'<h2>Thank you, {{customerName}}! 🙏</h2><p>We have received your consultation request and will contact you within 24 hours.</p><div style="background:#f7f2eb;border-left:4px solid #b8973a;padding:16px;margin:16px 0;"><p><strong>Budget:</strong> {{budget}}</p><p><strong>Preferred Time:</strong> {{preferredTime}}</p><p><strong>Requirements:</strong> {{requirements}}</p></div>' },
  { name:'Consultation Admin Alert', slug:'consultation_admin', subject:'New Consultation Request from {{customerName}}', variables:['customerName','email','phone','city','budget','preferredTime','requirements'],
    body:'<h2>New Consultation Request</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #e8dfd0;">{{customerName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #e8dfd0;">{{email}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">Phone</td><td style="padding:8px;border-bottom:1px solid #e8dfd0;">{{phone}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">City</td><td style="padding:8px;border-bottom:1px solid #e8dfd0;">{{city}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">Budget</td><td style="padding:8px;border-bottom:1px solid #e8dfd0;">{{budget}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8dfd0;font-weight:bold;">Requirements</td><td style="padding:8px;">{{requirements}}</td></tr></table>' },
]

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arihant_world')
    console.log('✅ Connected to MongoDB')

    // Admin user
    const existAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@arihantworld.com' })
    if (!existAdmin) {
      const admin = await User.create({
        firstName:'Admin', lastName:'Arihant',
        email: process.env.ADMIN_EMAIL || 'admin@arihantworld.com',
        phone:'+91 98765 43210',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role:'admin', isEmailVerified:true
      })
      await Wallet.create({ user: admin._id })
      console.log(`✅ Admin created: ${admin.email}`)
    } else { console.log('⚡ Admin already exists') }

    // Demo user
    const existUser = await User.findOne({ email: 'rajesh@demo.com' })
    if (!existUser) {
      const demoUser = await User.create({
        firstName:'Rajesh', lastName:'Sharma',
        email:'rajesh@demo.com', phone:'+91 87654 32109',
        password:'Demo@123456', role:'user', isEmailVerified:true,
        loyaltyPoints:1250, membershipTier:'Silver'
      })
      const wallet = await Wallet.create({ user: demoUser._id })
      await wallet.credit(2500, 'Welcome bonus', 'system', 'system')
      console.log(`✅ Demo user created: ${demoUser.email} (wallet: ₹2,500)`)
    } else { console.log('⚡ Demo user already exists') }

    // Products
    const pCount = await Product.countDocuments()
    if (pCount === 0) {
      await Product.insertMany([
        { name:'Radha Krishna Murti – 18"', slug:'radha-krishna-murti-18', category:'murtis', material:'Makrana White Marble', price:32000, salePrice:24500, stock:8, isInStock:true, badge:'Bestseller', isFeatured:true, rating:4.9, numReviews:128, craftingDays:14, description:'A timeless portrayal of divine love — Radha and Krishna carved from premium Makrana white marble.', shortDescription:'Handcrafted Radha Krishna in Makrana marble.', finish:['Polished','Matte','Antique Beige'], sizes:['9"','12"','18"','24"','36"','Custom'] },
        { name:'Ganesh Marble Idol – 8"', slug:'ganesh-idol-8', category:'murtis', material:'Makrana White Marble', price:8500, stock:25, isInStock:true, badge:'Bestseller', isFeatured:true, rating:4.8, numReviews:215, craftingDays:7, description:'Beautifully carved Lord Ganesha in pure white Makrana marble. Perfect for home entry.', finish:['Polished','Matte'], sizes:['6"','8"','12"','18"','Custom'] },
        { name:'Lakshmi Murti – 24"', slug:'lakshmi-murti-24', category:'murtis', material:'Pink Marble', price:38000, stock:5, isInStock:true, badge:'New', isFeatured:true, rating:4.8, numReviews:43, craftingDays:21, description:'Goddess Lakshmi carved in rare Pink Marble from Rajasthan.' },
        { name:'Shwetambar Marble Mandir', slug:'shwetambar-marble-mandir', category:'temples', material:'Makrana White Marble', price:185000, salePrice:152000, stock:3, isInStock:true, badge:'Exclusive', isFeatured:true, rating:5.0, numReviews:12, craftingDays:45, description:'A full home mandir carved from a single block of Makrana white marble.' },
        { name:'Marble Dining Table – 6 Seater', slug:'marble-dining-table-6', category:'furniture', material:'Black Marble', price:285000, stock:2, isInStock:true, badge:'Custom', isFeatured:true, rating:4.7, numReviews:8, craftingDays:60, description:'Elegant 6-seater dining table in premium Black Marble with gold metal legs.' },
        { name:'Lotus Carved Bowl', slug:'lotus-carved-bowl', category:'decor', material:'Makrana White Marble', price:4200, stock:50, isInStock:true, isFeatured:true, rating:4.6, numReviews:89, craftingDays:3, description:'Hand-carved lotus bowl in pure white marble — perfect for floating flowers or diyas.' },
        { name:'Marble Diya Set – 5 Piece', slug:'marble-diya-set-5', category:'decor', material:'Makrana White Marble', price:2800, stock:100, isInStock:true, isFeatured:false, rating:4.5, numReviews:178, craftingDays:2, description:'Set of 5 handcrafted marble diyas of different sizes.' },
        { name:'Garden Water Fountain – 36"', slug:'garden-fountain-36', category:'fountains', material:'Sandstone', price:125000, stock:4, isInStock:true, isFeatured:true, rating:4.9, numReviews:6, craftingDays:30, description:'Majestic 3-tier garden fountain carved from Rajasthani Sandstone.' },
        { name:'Shiva Lingam – 12"', slug:'shiva-lingam-12', category:'murtis', material:'Black Marble', price:15500, stock:12, isInStock:true, rating:4.8, numReviews:34, craftingDays:14, description:'Sacred Shiva Lingam carved from authentic Black Marble.' },
        { name:'Coffee Table – Marble Inlay', slug:'coffee-table-marble-inlay', category:'furniture', material:'Makrana White Marble', price:85000, stock:3, isInStock:true, badge:'Bestseller', isFeatured:true, rating:4.7, numReviews:22, craftingDays:30, description:'Stunning centre table with intricate pietra dura inlay work.' },
      ])
      console.log('✅ 10 products created')
    } else { console.log(`⚡ ${pCount} products already exist`) }

    // Coupons
    const cCount = await Coupon.countDocuments()
    if (cCount === 0) {
      await Coupon.insertMany([
        { code:'ARIHANT10', type:'percentage', value:10, minOrderAmount:5000, maxUses:1000, isActive:true, validFrom:new Date(), validUntil:new Date(Date.now()+365*24*60*60*1000) },
        { code:'WELCOME500', type:'fixed', value:500, minOrderAmount:2000, maxUses:1, perUserLimit:1, isActive:true, validFrom:new Date(), validUntil:new Date(Date.now()+365*24*60*60*1000) },
        { code:'FESTIVE20', type:'percentage', value:20, maxDiscount:10000, minOrderAmount:25000, maxUses:200, isActive:true, validFrom:new Date(), validUntil:new Date(Date.now()+30*24*60*60*1000) },
        { code:'SAVE10', type:'percentage', value:10, maxUses:500, isActive:true, validFrom:new Date(), validUntil:new Date(Date.now()+180*24*60*60*1000) },
      ])
      console.log('✅ 4 coupons created')
    } else { console.log(`⚡ ${cCount} coupons already exist`) }

    // Email templates
    const etCount = await EmailTemplate.countDocuments()
    if (etCount === 0) {
      await EmailTemplate.insertMany(DEFAULT_EMAIL_TEMPLATES)
      console.log(`✅ ${DEFAULT_EMAIL_TEMPLATES.length} email templates created`)
    } else { console.log(`⚡ ${etCount} email templates already exist`) }

    // Site settings
    const sCount = await SiteSettings.countDocuments({ key: 'main' })
    if (sCount === 0) {
      await SiteSettings.create({ key:'main', siteName:'Arihant World', tagline:'Premium Stone Arts', logo:'AW', since:'1985', phone:'+91 98765 43210', whatsapp:'+919876543210', email:'info@arihantworld.com', address:'Makrana, Nagaur District, Rajasthan – 341505, India', freeShippingThreshold:25000, gstPercent:18, announcementBar:'Free Shipping on orders above ₹25,000 | Use ARIHANT10 for 10% off', announcementActive:true })
      console.log('✅ Site settings created')
    } else { console.log('⚡ Site settings already exist') }

    console.log('\n🎉 Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Admin:     admin@arihantworld.com / Admin@123456')
    console.log('Demo User: rajesh@demo.com / Demo@123456')
    console.log('Coupons:   ARIHANT10, WELCOME500, FESTIVE20, SAVE10')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch(err) {
    console.error('❌ Seed failed:', err.message)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

seedDB()
