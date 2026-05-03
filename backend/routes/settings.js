const express = require('express')
const router = express.Router()
const SiteSettings = require('../models/SiteSettings')

router.get('/', async (req, res) => {
  try {
    let s = await SiteSettings.findOne({ key:'main' }).select('-razorpayKeySecret -cloudinaryApiSecret -emailPass')
    if (!s) s = await SiteSettings.create({ key:'main' })
    res.json({ success:true, settings: s })
  } catch(err) { res.status(500).json({ success:false, message: err.message }) }
})
module.exports = router
