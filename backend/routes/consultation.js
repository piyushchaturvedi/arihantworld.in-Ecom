const express = require('express')
const router = express.Router()
const ConsultationRequest = require('../models/ConsultationRequest')
const SiteSettings = require('../models/SiteSettings')
const sendEmail = require('../utils/sendEmail')

// POST /api/consultation — public submit
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, budget, requirements, preferredTime } = req.body
    if (!firstName || !email || !phone || !requirements) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' })
    }
    const consultation = await ConsultationRequest.create({ firstName, lastName, email, phone, city, budget, requirements, preferredTime })

    // Email to customer
    try {
      await sendEmail({
        to: email, templateSlug: 'consultation_request',
        variables: { customerName: `${firstName} ${lastName}`, budget, preferredTime, requirements }
      })
    } catch(e) { console.error('Customer email failed:', e.message) }

    // Email to admin
    try {
      const settings = await SiteSettings.findOne({ key: 'main' })
      const adminEmail = settings?.consultationAdminEmail || settings?.email || process.env.EMAIL_USER
      if (adminEmail) {
        await sendEmail({
          to: adminEmail, templateSlug: 'consultation_admin',
          variables: { customerName: `${firstName} ${lastName}`, email, phone, city, budget, preferredTime, requirements }
        })
      }
    } catch(e) { console.error('Admin email failed:', e.message) }

    res.status(201).json({ success: true, message: 'Consultation request submitted successfully!', consultation })
  } catch(err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
