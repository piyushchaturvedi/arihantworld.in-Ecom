/**
 * ONE-TIME MIGRATION SCRIPT
 * 
 * Existing products mein base64 images hain — yeh script unhe
 * Cloudinary pe upload karke DB mein URL se replace kar deta hai.
 * 
 * Run karo:
 *   cd backend
 *   node utils/migrateImages.js
 * 
 * Requirements:
 *   - .env mein Cloudinary credentials set hone chahiye
 *   - MongoDB running hona chahiye
 */

'use strict'
const path   = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.resolve(__dirname, '../.env.development') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const mongoose = require('mongoose')
const { uploadBase64ToCloudinary, cloudinaryConfigured } = require('./imageUpload')

async function migrate() {
  if (!cloudinaryConfigured()) {
    console.error('❌ Cloudinary not configured! Set env vars first.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arihant_world')
  console.log('✅ MongoDB connected')

  const Product = require('../models/Product')
  const products = await Product.find({})
  console.log(`📦 Total products: ${products.length}`)

  let migrated = 0, skipped = 0, errors = 0

  for (const product of products) {
    let changed = false
    const newImages = []

    for (const img of (product.images || [])) {
      if (!img.url) { newImages.push(img); continue }

      // Already a Cloudinary/HTTP URL — skip
      if (img.url.startsWith('http')) {
        newImages.push(img)
        skipped++
        continue
      }

      // base64 image — upload to Cloudinary
      if (img.url.startsWith('data:')) {
        try {
          process.stdout.write(`  Uploading image for "${product.name}"... `)
          const result = await uploadBase64ToCloudinary(img.url, 'arihant-world/products')
          newImages.push({ ...img.toObject(), url: result.url, publicId: result.publicId })
          console.log(`✅ ${result.url.slice(0, 60)}...`)
          changed = true
          migrated++
        } catch (err) {
          console.error(`❌ Failed: ${err.message}`)
          newImages.push(img) // keep original on error
          errors++
        }
        continue
      }

      newImages.push(img)
    }

    if (changed) {
      product.images = newImages
      await product.save()
      console.log(`💾 Saved: ${product.name}`)
    }
  }

  console.log('\n═══════════════════════════════')
  console.log(`✅ Migrated images : ${migrated}`)
  console.log(`⏭  Already URLs   : ${skipped}`)
  console.log(`❌ Errors         : ${errors}`)
  console.log('═══════════════════════════════')

  await mongoose.connection.close()
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
