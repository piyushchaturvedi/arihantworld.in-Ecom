const mongoose = require('mongoose')

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, enum: [
    'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
    'payment_success', 'payment_failed', 'forgot_password', 'otp_verify',
    'welcome', 'consultation_request', 'consultation_admin', 'custom'
  ]},
  subject: { type: String, required: true },
  body: { type: String, required: true }, // HTML body with {{variables}}
  variables: [String], // available variables like {{customerName}}, {{orderNumber}}
  isActive: { type: Boolean, default: true },
  lastModifiedBy: String,
}, { timestamps: true })

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema)
