import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
// Base URL without /api suffix — use this for direct fetch calls (invoices etc.)
export const BASE_URL = API_URL.replace(/\/api$/, '')
// Helper: get auth token from cookie
export const getAuthToken = () => typeof document !== 'undefined' ? document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('token='))?.split('=')[1] || '' : ''

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      if (typeof window !== 'undefined') window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  signup: (d) => api.post('/auth/signup', d),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (d) => api.post('/auth/reset-password', d),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getCategories: () => api.get('/products/categories'),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
}

export const cartAPI = {
  applyCoupon: (code, orderTotal) => api.post('/cart/coupon', { code, orderTotal }),
  removeCoupon: () => api.delete('/cart/coupon'),
}

export const ordersAPI = {
  getAll: (params) => api.get('/orders/my', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  initiatePayment: (orderId) => api.post(`/orders/${orderId}/payment`),
  verifyPayment: (data) => api.post('/orders/verify-payment', data),
}

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updatePassword: (data) => api.put('/profile/password', data),
  getAddresses: () => api.get('/profile/addresses'),
  addAddress: (data) => api.post('/profile/addresses', data),
  updateAddress: (id, data) => api.put(`/profile/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/profile/addresses/${id}`),
  getWishlist: () => api.get('/profile/wishlist'),
  addToWishlist: (productId) => api.post('/profile/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/profile/wishlist/${productId}`),
}

export const walletAPI = {
  getMy: () => api.get('/wallet/my'),
  topup: (amount) => api.post('/wallet/topup', { amount }),
}

export const consultationAPI = {
  submit: (data) => api.post('/consultation', data),
}

export const settingsAPI = {
  get: () => api.get('/settings'),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (period) => api.get('/admin/analytics/revenue', { params: { period } }),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  uploadProductImage: (formData) => api.post('/admin/products/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProductImages: (formData) => api.post('/admin/products/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, note, tracking) => api.put(`/admin/orders/${id}/status`, { status, note, tracking }),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  changeUserPassword: (id, newPassword) => api.put(`/admin/users/${id}/change-password`, { newPassword }),
  changeOwnPassword: (currentPassword, newPassword) => api.put('/admin/change-own-password', { currentPassword, newPassword }),

  // Wallet
  getUserWallet: (userId) => api.get(`/admin/wallet/${userId}`),
  creditWallet: (userId, data) => api.post(`/admin/wallet/${userId}/credit`, data),
  debitWallet: (userId, data) => api.post(`/admin/wallet/${userId}/debit`, data),

  // Coupons
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Email Templates
  getEmailTemplates: () => api.get('/admin/email-templates'),
  getEmailTemplate: (id) => api.get(`/admin/email-templates/${id}`),
  createEmailTemplate: (data) => api.post('/admin/email-templates', data),
  updateEmailTemplate: (id, data) => api.put(`/admin/email-templates/${id}`, data),
  deleteEmailTemplate: (id) => api.delete(`/admin/email-templates/${id}`),
  sendTestEmail: (data) => api.post('/admin/email-templates/test', data),

  // Consultations
  getConsultations: (params) => api.get('/admin/consultations', { params }),
  updateConsultation: (id, data) => api.put(`/admin/consultations/${id}`, data),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  uploadLogo: (formData) => api.post('/admin/settings/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export default api
