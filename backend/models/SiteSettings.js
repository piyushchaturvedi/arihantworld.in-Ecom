const mongoose = require('mongoose')

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  // General
  siteName: { type: String, default: 'Arihant World' },
  tagline: { type: String, default: 'Premium Stone Arts' },
  description: { type: String, default: 'Handcrafted marble murtis, home temples & décor by master artisans. Premium Makrana marble since 1985.' },
  logo: { type: String, default: 'AW' },
  logoUrl: String,
  since: { type: String, default: '1985' },
  // Contact
  phone: { type: String, default: '+91 98765 43210' },
  whatsapp: { type: String, default: '+919876543210' },
  email: { type: String, default: 'info@arihantworld.com' },
  address: { type: String, default: 'Makrana, Nagaur District, Rajasthan – 341505, India' },
  city: String, state: String, pincode: String, country: { type: String, default: 'India' },
  // Commerce
  currency: { type: String, default: '₹' },
  freeShippingThreshold: { type: Number, default: 25000 },
  gstPercent: { type: Number, default: 18 },
  defaultShippingRate: { type: Number, default: 350 },
  internationalShipping: { type: Boolean, default: true },
  internationalRate: { type: Number, default: 2500 },
  domesticDeliveryMin: { type: Number, default: 7 },
  domesticDeliveryMax: { type: Number, default: 14 },
  // Socials
  facebook: String, instagram: String, youtube: String, twitter: String, pinterest: String,
  // SEO
  metaTitle: { type: String, default: 'Arihant World – Premium Marble Artistry' },
  metaDescription: String,
  keywords: String,
  googleAnalyticsId: String,
  // Payments
  razorpayMode: { type: String, enum: ['test','live'], default: 'test' },
  razorpayKeyId: String,
  razorpayKeySecret: String,
  onlinePaymentDiscountPct: { type: Number, default: 5 }, // % discount for online payment
  onlinePaymentDiscountMsg: { type: String, default: '🎉 5% instant discount on Online Payment!' },
  onlinePaymentDiscountEnabled: { type: Boolean, default: true },
  // Cloudinary
  cloudinaryCloudName: String, cloudinaryApiKey: String, cloudinaryApiSecret: String,
  // Email
  emailHost: String, emailPort: String, emailUser: String, emailPass: String, emailFrom: String,
  // Announcement
  announcementBar: { type: String, default: 'Free Shipping on orders above ₹25,000 | Use code ARIHANT10 for 10% off' },
  announcementActive: { type: Boolean, default: true },
  // Wallet settings
  walletMaxUsePct: { type: Number, default: 100 }, // max % of order total payable by wallet
  walletEnabled: { type: Boolean, default: true },
  walletExpiryDays: { type: Number, default: 0 }, // 0 = no expiry by default for new credits
  // COD Advance Payment
  codAdvanceEnabled: { type: Boolean, default: false }, // require partial UPI advance for COD
  codAdvancePct: { type: Number, default: 10 },        // % of order total to pay in advance
  codAdvanceUPI: { type: String, default: '' },         // UPI ID admin configures
  codAdvanceMsg: { type: String, default: 'To confirm your COD order, please pay the advance amount via UPI.' },
  // Pincode checker
  pincodeCheckerEnabled: { type: Boolean, default: true },
  // Consultation
  consultationFormEnabled: { type: Boolean, default: true },
  consultationAdminEmail: String,

  // ── Homepage Content (all admin-manageable) ──────────────
  stats: {
    type: [{ value: String, label: String }],
    default: [
      { value: '40+',  label: 'Years of Craft' },
      { value: '50K+', label: 'Happy Homes' },
      { value: '30+',  label: 'Countries Served' },
    ]
  },
  testimonials: {
    type: [{ name: String, city: String, rating: Number, text: String }],
    default: [
      { name: 'Priya Mehta',    city: 'Mumbai',  rating: 5, text: 'The Radha Krishna murti is absolutely divine. The detailing is extraordinary — you can feel the devotion of the artisan in every curve.' },
      { name: 'Rajesh Sharma',  city: 'Jaipur',  rating: 5, text: 'We ordered a custom home temple for our pooja room. The quality surpassed all expectations. Delivery was prompt.' },
      { name: 'Anita Verma',    city: 'Delhi',   rating: 5, text: 'The marble inlay coffee table is a showstopper. Every guest asks about it. Truly one-of-a-kind craftsmanship.' },
    ]
  },
  process: {
    type: [{ num: String, title: String, desc: String }],
    default: [
      { num:'01', title:'Select Marble',  desc:'Only Grade-A Makrana marble, hand-selected from the same quarries as the Taj Mahal.' },
      { num:'02', title:'Sacred Design',  desc:'Designs crafted following Shilpa Shastras — ancient texts of Indian sacred art and proportion.' },
      { num:'03', title:'Master Carving', desc:'Skilled artisans with decades of experience carve each detail by hand, preserving tradition.' },
      { num:'04', title:'Safe Delivery',  desc:'Carefully packed and delivered to your doorstep across India and 30+ countries worldwide.' },
    ]
  },
  faqs: {
    type: [{ q: String, a: String }],
    default: [
      { q:'What type of marble do you use?', a:'We use only Grade-A Makrana White Marble — the same marble used in the Taj Mahal.' },
      { q:'How long does it take to craft a murti?', a:'Standard murtis take 7–15 days. Custom or large pieces may take 30–60 days.' },
      { q:'Do you ship internationally?', a:'Yes! We ship to 30+ countries worldwide with premium packaging.' },
      { q:'Can I request a custom size or design?', a:'Absolutely. Custom orders are our specialty. Contact us for a free consultation.' },
      { q:'What is your return policy?', a:'We offer a 7-day hassle-free return policy for standard products.' },
    ]
  },
  categories: {
    type: [{ slug: String, label: String, icon: String, description: String }],
    default: [
      { slug:'murtis',    label:'Murtis',    icon:'🕉️',  description:'Divine marble idols' },
      { slug:'temples',   label:'Temples',   icon:'⛩️',  description:'Sacred home mandirs' },
      { slug:'furniture', label:'Furniture', icon:'🏛️',  description:'Marble inlay tables' },
      { slug:'decor',     label:'Décor',     icon:'💐',  description:'Vases, bowls & diyas' },
      { slug:'fountains', label:'Fountains', icon:'🌊',  description:'Water features' },
      { slug:'custom',    label:'Custom',    icon:'✨',  description:'Bespoke creations' },
    ]
  },
  aboutImages: {
    type: [{ url: String, alt: String }],
    default: [
      { url:'', alt:'Marble artisan at work' },
      { url:'', alt:'Premium marble selection' },
      { url:'', alt:'Finished marble murti' },
      { url:'', alt:'Arihant World workshop' },
    ]
  },
  // Temple spotlight section (shown after Furniture on homepage)
  templeSectionEnabled: { type: Boolean, default: true },
  templeSectionTitle: { type: String, default: 'Sacred Home Temples' },
  templeSectionSubtitle: { type: String, default: 'Handcrafted home mandirs in premium Makrana marble — bless your home with divine presence.' },
  templeSectionCTA: { type: String, default: 'Explore Temples' },
  templeSectionCTALink: { type: String, default: '/category/temples' },
  templeSectionImages: {
    type: [{ url: String, alt: String }],
    default: [
      { url: '', alt: 'Home Temple 1' },
      { url: '', alt: 'Home Temple 2' },
      { url: '', alt: 'Home Temple 3' },
    ]
  },
  heroTitle: { type: String, default: 'Divine Craftsmanship in Marble' },
  heroSubtitle: { type: String, default: 'Handcrafted marble murtis, home temples & décor by third-generation artisans. Since 1985.' },
  heroCTA1: { type: String, default: 'Explore Collections' },
  heroCTA2: { type: String, default: 'Our Story' },
  heroTagline: { type: String, default: 'SINCE 1985 · MAKRANA MARBLE · THIRD-GENERATION ARTISANS' },
  heroImageUrl: { type: String, default: '' }, // background image for hero section
  // ── Luxury Living Section (custom 4-card section on homepage) ──
  luxurySectionEnabled: { type: Boolean, default: false },
  luxurySectionBadge: { type: String, default: 'Luxury Living' },
  luxurySectionTitle: { type: String, default: 'Shop' },
  luxurySectionTitleItalic: { type: String, default: 'Furniture' },
  luxurySectionCards: {
    type: [{
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      redirectUrl: { type: String, default: 'https://arihantdivinearts.com/' },
    }],
    default: [
      { title: 'Marble Coffee Tables', subtitle: 'Handcrafted elegance', imageUrl: '', redirectUrl: 'https://arihantdivinearts.com/' },
      { title: 'Dining Sets', subtitle: 'Premium inlay work', imageUrl: '', redirectUrl: 'https://arihantdivinearts.com/' },
      { title: 'Console Tables', subtitle: 'Classic artistry', imageUrl: '', redirectUrl: 'https://arihantdivinearts.com/' },
      { title: 'Side Tables', subtitle: 'Timeless beauty', imageUrl: '', redirectUrl: 'https://arihantdivinearts.com/' },
    ]
  },
  aboutTitle: { type: String, default: 'Where Sacred Art Meets Eternity' },
  aboutText: { type: String, default: 'At Arihant World, every piece is born from the same white Makrana marble that built the Taj Mahal. Our master Shilpa Shastris — hereditary craftsmen — breathe devotion into every chisel stroke, creating heirlooms that carry the sacred energy of tradition.' },
  aboutText2: { type: String, default: 'Guided by Vastu principles and the science of sacred geometry, we don\'t merely make objects — we create spaces that elevate consciousness and invite the divine into your home.' },
}, { timestamps: true })

module.exports = mongoose.model('SiteSettings', siteSettingsSchema)
