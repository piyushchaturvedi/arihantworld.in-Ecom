
# Arihant World — Complete E-Commerce Platform

Premium marble artistry e-commerce website with Next.js frontend, Node.js backend API, and full Admin panel.

---

## 📁 Project Structure

```
arihant_world_complete/       ← Complete static HTML website (11 pages)
arihant_world_nextjs/
  ├── frontend/               ← Next.js 14 App Router frontend
  └── backend/                ← Node.js + Express + MongoDB API
```

---

## 🌐 Static HTML Website (arihant_world_complete)

All pages ready to use immediately, no build step needed.

| Page | File |
|------|------|
| Homepage | index.html |
| Products | products.html |
| Product Detail | product-detail.html |
| Cart | cart.html |
| Checkout | checkout.html |
| Login | login.html |
| Sign Up | signup.html |
| Forgot Password | forgot-password.html |
| My Profile | profile.html |
| Order History | order-history.html |
| Privacy Policy | privacy.html |

---

## ⚙️ Next.js Frontend Setup

### Requirements
- Node.js 18+
- npm or yarn

### Installation
```bash
cd arihant_world_nextjs/frontend
npm install
```

### Development
```bash
npm run dev
# Opens at http://localhost:3000
```

### Build for production
```bash
npm run build
npm start
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_NAME=Arihant World
```

### Pages & Routes
| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, collections, featured products |
| `/products` | Product listing with filters |
| `/products/[id]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with address & payment |
| `/auth/login` | Login page |
| `/auth/signup` | Registration page |
| `/auth/forgot-password` | Password reset flow |
| `/profile` | User profile (tabs: Info, Addresses, Wishlist, Security, Notifications) |
| `/orders` | Order history with tracking |
| `/privacy` | Privacy policy |
| `/admin` | Admin dashboard |
| `/admin/orders` | Order management |
| `/admin/products` | Product management (CRUD) |
| `/admin/users` | User management |
| `/admin/coupons` | Coupon management |
| `/admin/analytics` | Revenue analytics |

---

## 🔧 Node.js Backend Setup

### Requirements
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)
- Gmail app password (for emails)

### Installation
```bash
cd arihant_world_nextjs/backend
npm install
```

### Environment Variables
Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arihant_world
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@arihantworld.com
ADMIN_PASSWORD=Admin@123456
```

### Seed Database
```bash
npm run seed
```
This creates:
- Admin user: `admin@arihantworld.com` / `Admin@123456`
- Demo user: `rajesh@demo.com` / `Demo@123456`
- 10 sample products
- 4 coupons (ARIHANT10, WELCOME500, FESTIVE20, SAVE10)

### Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/signup | — | Register new user |
| POST | /auth/login | — | Login |
| GET | /auth/me | ✅ | Get current user |
| POST | /auth/logout | ✅ | Logout |
| POST | /auth/forgot-password | — | Send OTP to email |
| POST | /auth/verify-otp | — | Verify OTP |
| POST | /auth/reset-password | — | Reset with OTP |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /products | — | List products (filter, search, paginate) |
| GET | /products/featured | — | Featured products |
| GET | /products/categories | — | Category list |
| GET | /products/:id | — | Single product |
| POST | /products/:id/reviews | ✅ | Add review |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /cart/coupon | ✅ | Validate coupon |
| DELETE | /cart/coupon | ✅ | Remove coupon |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /orders/my | ✅ | My orders |
| GET | /orders/:id | ✅ | Order detail |
| POST | /orders | ✅ | Create order |
| POST | /orders/:id/payment | ✅ | Initiate Razorpay |
| POST | /orders/verify-payment | ✅ | Verify payment |
| PUT | /orders/:id/cancel | ✅ | Cancel order |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /profile | ✅ | Get profile |
| PUT | /profile | ✅ | Update profile |
| PUT | /profile/password | ✅ | Change password |
| GET | /profile/addresses | ✅ | Get addresses |
| POST | /profile/addresses | ✅ | Add address |
| PUT | /profile/addresses/:id | ✅ | Update address |
| DELETE | /profile/addresses/:id | ✅ | Delete address |
| GET | /profile/wishlist | ✅ | Get wishlist |
| POST | /profile/wishlist | ✅ | Add to wishlist |
| DELETE | /profile/wishlist/:id | ✅ | Remove from wishlist |

### Admin (Admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Stats & summary |
| GET | /admin/products | Product list |
| POST | /admin/products | Create product |
| PUT | /admin/products/:id | Update product |
| DELETE | /admin/products/:id | Deactivate product |
| GET | /admin/orders | All orders |
| GET | /admin/orders/:id | Order detail |
| PUT | /admin/orders/:id/status | Update status |
| GET | /admin/users | All users |
| GET | /admin/users/:id | User detail |
| PUT | /admin/users/:id | Update user |
| GET | /admin/coupons | All coupons |
| POST | /admin/coupons | Create coupon |
| PUT | /admin/coupons/:id | Update coupon |
| DELETE | /admin/coupons/:id | Delete coupon |
| GET | /admin/analytics/revenue | Revenue chart data |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Gold | `#b8973a` |
| Cream | `#f7f2eb` |
| Stone | `#e8dfd0` |
| Charcoal | `#2a2520` |
| Warm | `#5c4a35` |
| Font Serif | Cormorant Garamond |
| Font Sans | Jost |

### Coupon Codes (for testing)
- `ARIHANT10` — 10% off (min ₹5,000)
- `WELCOME500` — ₹500 off (min ₹3,000)
- `FESTIVE20` — 20% off (min ₹10,000)
- `SAVE10` — 10% off (min ₹1,000)

---

## 🚀 Quick Start (Full Stack)

```bash
# Terminal 1 — Backend
cd arihant_world_nextjs/backend
npm install
npm run seed     # seed DB first time
npm run dev      # starts on :5000

# Terminal 2 — Frontend
cd arihant_world_nextjs/frontend
npm install
npm run dev      # starts on :3000
```

Then visit:
- **Website**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API Health**: http://localhost:5000/api/health

---

## 📦 Tech Stack

**Frontend**: Next.js 14, React 18, Tailwind CSS, Zustand, Axios, react-hot-toast

**Backend**: Node.js, Express 4, MongoDB, Mongoose, JWT, bcryptjs, Nodemailer, Razorpay, Cloudinary

**Security**: Helmet, express-rate-limit, express-mongo-sanitize, bcrypt (12 rounds)

---

© 2026 Arihant World. Built with ❤️
=======
# arihantworld.in-Ecom
