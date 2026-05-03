const mongoose = require('mongoose')

const consultationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: String,
  budget: String,
  requirements: { type: String, required: true },
  preferredTime: String,
  status: { type: String, enum: ['new','contacted','converted','closed'], default: 'new' },
  notes: String, // admin notes
}, { timestamps: true })

module.exports = mongoose.model('ConsultationRequest', consultationSchema)
