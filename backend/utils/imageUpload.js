/**
 * Image upload utility
 * - If Cloudinary env vars set → uploads to Cloudinary (permanent)
 * - Otherwise → saves base64 locally (dev/demo mode)
 * 
 * To enable Cloudinary:
 * 1. Sign up at cloudinary.com (free tier: 25 credits/month)
 * 2. Get Cloud Name, API Key, API Secret from Dashboard
 * 3. Add to backend/.env:
 *    CLOUDINARY_CLOUD_NAME=your_cloud
 *    CLOUDINARY_API_KEY=your_key
 *    CLOUDINARY_API_SECRET=your_secret
 */
const cloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key'

async function uploadToCloudinary(buffer, mimetype, folder = 'arihant-world') {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error) reject(error)
        else resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

async function deleteFromCloudinary(publicId) {
  if (!cloudinaryConfigured() || !publicId) return
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary.uploader.destroy(publicId)
}

/**
 * Upload a single image buffer
 * @param {Buffer} buffer - file buffer
 * @param {string} mimetype - e.g. 'image/jpeg'
 * @param {string} folder - cloudinary folder name
 * @returns {{ url: string, publicId?: string, storage: string }}
 */
async function uploadImage(buffer, mimetype, folder = 'arihant-world') {
  if (cloudinaryConfigured()) {
    const result = await uploadToCloudinary(buffer, mimetype, folder)
    return { url: result.url, publicId: result.publicId, storage: 'cloudinary' }
  }
  // Fallback: base64 data URL (works in dev, not recommended for prod)
  const b64 = buffer.toString('base64')
  const url = `data:${mimetype};base64,${b64}`
  return { url, storage: 'base64', note: 'Set CLOUDINARY env vars for permanent storage' }
}

/**
 * Upload multiple images
 */
async function uploadImages(files, folder = 'arihant-world') {
  return Promise.all(files.map(f => uploadImage(f.buffer, f.mimetype, folder)))
}

module.exports = { uploadImage, uploadImages, deleteFromCloudinary, cloudinaryConfigured }
