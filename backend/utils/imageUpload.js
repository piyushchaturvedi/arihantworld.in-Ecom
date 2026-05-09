/**
 * Image Upload Utility — Cloudinary Only
 * 
 * Base64 DB storage completely removed.
 * Sabhi images Cloudinary pe upload hongi, DB mein sirf URL store hoga.
 * 
 * Setup:
 *   backend/.env mein add karo:
 *     CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
 *     CLOUDINARY_API_KEY=your_api_key
 *     CLOUDINARY_API_SECRET=your_api_secret
 */

const cloudinary = require('cloudinary').v2

function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })
}

function cloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} mimetype  e.g. 'image/jpeg'
 * @param {string} folder    Cloudinary folder
 * @returns {{ url: string, publicId: string }}
 */
async function uploadImage(buffer, mimetype, folder = 'arihant-world/products') {
  if (!cloudinaryConfigured()) {
    throw new Error(
      'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env file.'
    )
  }
  initCloudinary()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality:       'auto:good',
        fetch_format:  'auto',         // auto webp/avif for browsers that support it
        flags:         'progressive',  // progressive JPEG
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // max 1200px — no upscaling
        ],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Upload multiple image files
 * @param {Array<{buffer, mimetype}>} files
 * @param {string} folder
 * @returns {Array<{ url, publicId }>}
 */
async function uploadImages(files, folder = 'arihant-world/products') {
  return Promise.all(files.map(f => uploadImage(f.buffer, f.mimetype, folder)))
}

/**
 * Upload a base64 data URL string to Cloudinary
 * Used for migrating existing base64 images stored in DB
 * @param {string} dataUrl  e.g. 'data:image/jpeg;base64,...'
 * @param {string} folder
 */
async function uploadBase64ToCloudinary(dataUrl, folder = 'arihant-world/products') {
  if (!cloudinaryConfigured()) throw new Error('Cloudinary not configured')
  initCloudinary()

  // cloudinary.uploader.upload accepts data URIs directly
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: 'image',
    quality:       'auto:good',
    fetch_format:  'auto',
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  })
  return { url: result.secure_url, publicId: result.public_id }
}

/**
 * Delete image from Cloudinary by publicId
 */
async function deleteFromCloudinary(publicId) {
  if (!cloudinaryConfigured() || !publicId) return
  initCloudinary()
  return cloudinary.uploader.destroy(publicId)
}

module.exports = {
  uploadImage,
  uploadImages,
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  cloudinaryConfigured,
}
