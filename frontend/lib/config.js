// ─────────────────────────────────────────────────────────────────────────────
// lib/config.js — MINIMAL fallback only.
// All live config is loaded from Admin > Settings via SettingsProvider context.
// Use useSettings() hook to access dynamic data everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_CONFIG = {
  name:                 'Arihant World',
  tagline:              'Premium Stone Arts',
  description:          'Handcrafted marble murtis, home temples & décor. Premium Makrana marble since 1985.',
  logo:                 'AW',
  since:                '1985',
  phone:                '+91 98765 43210',
  whatsapp:             '+919876543210',
  email:                'info@arihantworld.com',
  address:              'Makrana, Nagaur District, Rajasthan – 341505, India',
  currency:             '₹',
  freeShippingThreshold: 25000,
  gstPercent:           18,
  announcementBar:      'Free Shipping on orders above ₹25,000 | Use code ARIHANT10 for 10% off',
  announcementActive:   true,
  socials: {
    facebook:  'https://facebook.com/arihantworld',
    instagram: 'https://instagram.com/arihantworld',
    youtube:   'https://youtube.com/arihantworld',
  },
  categories: [
    { slug:'murtis',    label:'Murtis',    icon:'🕉️',  description:'Divine marble idols' },
    { slug:'temples',   label:'Temples',   icon:'⛩️',  description:'Sacred home mandirs' },
    { slug:'furniture', label:'Furniture', icon:'🏛️',  description:'Marble inlay tables' },
    { slug:'decor',     label:'Décor',     icon:'💐',  description:'Vases, bowls & diyas' },
    { slug:'fountains', label:'Fountains', icon:'🌊',  description:'Water features' },
    { slug:'custom',    label:'Custom',    icon:'✨',  description:'Bespoke creations' },
  ],
  stats: [
    { value:'40+',  label:'Years of Craft' },
    { value:'50K+', label:'Happy Homes' },
    { value:'30+',  label:'Countries Served' },
  ],
  testimonials: [
    { name:'Priya Mehta',   city:'Mumbai',  rating:5, text:'The Radha Krishna murti is absolutely divine. The detailing is extraordinary.' },
    { name:'Rajesh Sharma', city:'Jaipur',  rating:5, text:'We ordered a custom home temple for our pooja room. The quality surpassed all expectations.' },
    { name:'Anita Verma',   city:'Delhi',   rating:5, text:'The marble inlay coffee table is a showstopper. Truly one-of-a-kind craftsmanship.' },
  ],
  process: [
    { num:'01', title:'Select Marble',  desc:'Only Grade-A Makrana marble, hand-selected from the same quarries as the Taj Mahal.' },
    { num:'02', title:'Sacred Design',  desc:'Designs crafted following Shilpa Shastras — ancient texts of Indian sacred art.' },
    { num:'03', title:'Master Carving', desc:'Skilled artisans carve each detail by hand, preserving centuries of tradition.' },
    { num:'04', title:'Safe Delivery',  desc:'Carefully packed and delivered to your doorstep across India and 30+ countries.' },
  ],
  faqs: [
    { q:'What type of marble do you use?', a:'We use only Grade-A Makrana White Marble — the same marble used in the Taj Mahal.' },
    { q:'How long does it take to craft a murti?', a:'Standard murtis take 7–15 days. Custom pieces may take 30–60 days.' },
    { q:'Do you ship internationally?', a:'Yes! We ship to 30+ countries worldwide with premium packaging.' },
    { q:'Can I request a custom size or design?', a:'Absolutely. Custom orders are our specialty. Contact us for a free consultation.' },
    { q:'What is your return policy?', a:'We offer a 7-day hassle-free return policy for standard products.' },
  ],
  heroTitle:    'Divine Craftsmanship in Marble',
  heroSubtitle: 'Handcrafted marble murtis, home temples & décor by third-generation artisans. Since 1985.',
  heroCTA1:     'Explore Collections',
  heroCTA2:     'Our Story',
  heroTagline:  'SINCE 1985 · MAKRANA MARBLE · THIRD-GENERATION ARTISANS',
  aboutTitle:   'Where Sacred Art Meets Eternity',
  aboutText:    'At Arihant World, every piece is born from the same white Makrana marble that built the Taj Mahal.',
  aboutText2:   'Guided by Vastu principles, we create spaces that elevate consciousness and invite the divine into your home.',
}

// Currency formatter — always use this instead of hardcoding ₹
export const fmt = (n) => `${SITE_CONFIG.currency}${Number(n || 0).toLocaleString('en-IN')}`
