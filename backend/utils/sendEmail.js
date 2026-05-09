const nodemailer = require('nodemailer')

// ─── SMTP Transporter ─────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER || 'arihantdivinearts@gmail.com',
    pass: process.env.EMAIL_PASS || 'nuyb bipo clzo cvrw',
  },
  tls: { rejectUnauthorized: false }
})

// ─── Base HTML wrapper ─────────────────────────────────────────
const baseTemplate = (content, footerNote = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arihant World</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#f7f2eb; color:#2a2520; }
    .wrapper { max-width:600px; margin:0 auto; background:#fff; }
    .header { background:#2a2520; padding:28px 32px; text-align:center; }
    .header-logo { display:inline-flex; align-items:center; gap:12px; text-decoration:none; }
    .logo-circle { width:48px; height:48px; border:2px solid #b8973a; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .logo-text { color:white; font-size:16px; font-weight:bold; letter-spacing:1px; }
    .logo-sub { color:#b8973a; font-size:9px; letter-spacing:4px; text-transform:uppercase; margin-top:2px; }
    .divider { height:3px; background:linear-gradient(90deg, #2a2520, #b8973a, #2a2520); }
    .body { padding:36px 32px; }
    .greeting { font-size:22px; color:#2a2520; margin-bottom:8px; font-family:Georgia,serif; }
    .body p { font-size:14px; line-height:1.7; color:#5a4a3a; margin-bottom:14px; }
    .btn { display:inline-block; background:#b8973a; color:white !important; padding:13px 32px; text-decoration:none; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:20px 0; border-radius:1px; }
    .info-box { background:#f7f2eb; border-left:4px solid #b8973a; padding:16px 20px; margin:20px 0; border-radius:0 4px 4px 0; }
    .info-box p { margin:0; font-size:13px; }
    .order-table { width:100%; border-collapse:collapse; margin:20px 0; font-size:13px; }
    .order-table th { background:#2a2520; color:white; padding:10px 12px; text-align:left; font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    .order-table td { padding:10px 12px; border-bottom:1px solid #e8dfd0; color:#4a3a2a; }
    .order-table tr:last-child td { border-bottom:none; }
    .total-row td { font-weight:bold; color:#2a2520; background:#f7f2eb; }
    .amount { color:#b8973a; font-weight:bold; font-size:15px; }
    .badge { display:inline-block; background:#b8973a; color:white; font-size:10px; padding:3px 10px; letter-spacing:1px; text-transform:uppercase; }
    .footer { background:#1a1208; padding:24px 32px; text-align:center; }
    .footer p { color:rgba(255,255,255,0.45); font-size:11px; line-height:1.8; }
    .footer a { color:#b8973a; text-decoration:none; }
    .social-links { margin:12px 0; }
    .social-links a { color:#b8973a; text-decoration:none; margin:0 8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    @media (max-width:600px) { .body { padding:24px 20px; } .header { padding:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">
        <div class="logo-circle"><span style="color:#b8973a;font-size:16px;font-weight:bold;">AW</span></div>
        <div>
          <div class="logo-text">Arihant World</div>
          <div class="logo-sub">Premium Stone Arts</div>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="body">${content}</div>
    <div class="footer">
      <div class="social-links">
        <a href="https://arihantdivinearts.in">Website</a>
        <a href="https://instagram.com/arihantworld">Instagram</a>
        <a href="https://facebook.com/arihantworld">Facebook</a>
      </div>
      <p>Arihant World | Makrana, Rajasthan – 341505, India</p>
      <p><a href="mailto:arihantdivinearts@gmail.com">arihantdivinearts@gmail.com</a> | +91 98765 43210</p>
      ${footerNote ? `<p style="margin-top:10px;color:rgba(255,255,255,0.25);font-size:10px;">${footerNote}</p>` : ''}
      <p style="margin-top:10px;color:rgba(255,255,255,0.25);font-size:10px;">© ${new Date().getFullYear()} Arihant World. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

// ─── Email Templates ───────────────────────────────────────────

const templates = {
  // ── TO CUSTOMER: Order confirmed ──────────────────────────────
  orderConfirmed: ({ order, customer }) => ({
    to: customer.email,
    subject: `Order Confirmed – #${order.orderNumber} | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Namaste, ${customer.firstName}! 🙏</h2>
      <p>Thank you for your order. We've received it and our master artisans are preparing your sacred piece with great care.</p>
      <div class="info-box">
        <p><strong>Order Number:</strong> <span style="font-size:16px;color:#b8973a;font-weight:bold;">#${order.orderNumber}</span></p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt||Date.now()).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>
        <p><strong>Payment:</strong> ${(order.payment?.method||'ONLINE').toUpperCase()} – <span style="color:#22c55e">✓ Confirmed</span></p>
        ${order.payment?.codAdvanceAmount > 0 ? `<p><strong>Advance Paid:</strong> ₹${order.payment.codAdvanceAmount.toLocaleString('en-IN')} · Cash on delivery: ₹${((order.pricing?.total||0) - order.payment.codAdvanceAmount).toLocaleString('en-IN')}</p>` : ''}
      </div>
      <table class="order-table">
        <thead><tr><th>Item</th><th>Size / Variant</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
          ${(order.items||[]).map(i => `<tr>
            <td>${i.name}</td>
            <td style="color:#b8973a;font-size:12px;">${i.variant||'Standard'}</td>
            <td style="text-align:center;">${i.qty}</td>
            <td>₹${((i.price||0)*(i.qty||1)).toLocaleString('en-IN')}</td>
          </tr>`).join('')}
          <tr class="total-row"><td colspan="3"><strong>Total</strong></td><td><span class="amount">₹${(order.pricing?.total||0).toLocaleString('en-IN')}</span></td></tr>
        </tbody>
      </table>
      <p><strong>Delivery to:</strong> ${order.shippingAddress?.name}, ${order.shippingAddress?.line1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} – ${order.shippingAddress?.pincode}</p>
      <p>Estimated crafting + delivery: <strong>7–21 business days</strong>. We'll send you a tracking link once your order ships.</p>
      <a href="${process.env.FRONTEND_URL||'https://arihantdivinearts.in'}/orders" class="btn">Track Your Order</a>
      <p style="font-size:13px;color:#9a8a70;">Questions? Reply to this email or WhatsApp us at +91 98765 43210</p>
    `, 'This is an automated order confirmation email.')
  }),

  // ── TO CUSTOMER: Order shipped ─────────────────────────────────
  orderShipped: ({ order, customer, tracking }) => ({
    to: customer.email,
    subject: `Your Order #${order.orderNumber} is on its Way! 🚚 | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Great news, ${customer.firstName}!</h2>
      <p>Your order has been packed with premium wooden crating and is now on its way to you. 📦</p>
      <div class="info-box">
        <p><strong>Order:</strong> #${order.orderNumber}</p>
        ${tracking?.carrier ? `<p><strong>Carrier:</strong> ${tracking.carrier}</p>` : ''}
        ${tracking?.awbNumber ? `<p><strong>AWB / Tracking No:</strong> <span style="font-family:monospace;font-size:15px;">${tracking.awbNumber}</span></p>` : ''}
        ${tracking?.estimatedDelivery ? `<p><strong>Expected Delivery:</strong> ${new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>` : ''}
      </div>
      ${tracking?.trackingUrl ? `<a href="${tracking.trackingUrl}" class="btn">Track Your Package</a>` : ''}
      <p>Please ensure someone is available to receive the package. Handle with care – your marble piece is fragile!</p>
      <a href="https://arihantdivinearts.in/orders" class="btn">View Order Details</a>
    `, 'This is a shipping notification email.')
  }),

  // ── TO CUSTOMER: Order delivered ──────────────────────────────
  orderDelivered: ({ order, customer }) => ({
    to: customer.email,
    subject: `Delivered! How's your piece, ${customer.firstName}? | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Your order has arrived! 🎉</h2>
      <p>We hope your Arihant World piece brings divine energy and beauty to your home. Every piece is crafted with devotion by our third-generation artisans.</p>
      <div class="info-box">
        <p><strong>Order:</strong> #${order.orderNumber}</p>
        <p>If you love your piece, we'd be grateful for a review. It helps other families make the right choice.</p>
      </div>
      <a href="https://arihantdivinearts.in/orders" class="btn">Write a Review</a>
      <p>If you have any concerns about your order, please reach out within 7 days for our hassle-free returns policy.</p>
      <p style="font-size:12px;color:#9a8a70;">📞 +91 98765 43210 &nbsp;|&nbsp; ✉ arihantdivinearts@gmail.com</p>
    `, 'Delivered notification email.')
  }),

  // ── TO CUSTOMER: Order processing ────────────────────────────
  orderProcessing: ({ order, customer }) => ({
    to: customer.email,
    subject: `Your Order #${order.orderNumber} is Being Crafted 🏛️ | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">We're crafting your piece, ${customer.firstName}!</h2>
      <p>Your order is now being processed and carefully handcrafted by our master artisans. We'll keep you updated every step of the way.</p>
      <div class="info-box">
        <p><strong>Order:</strong> #${order.orderNumber}</p>
        <p><strong>Status:</strong> Processing / Being Crafted</p>
        <p>Our artisans are working with devotion to perfect every detail of your piece.</p>
      </div>
      <a href="https://arihantdivinearts.in/orders" class="btn">Track Your Order</a>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p style="font-size:12px;color:#9a8a70;">📞 +91 98765 43210 &nbsp;|&nbsp; ✉ arihantdivinearts@gmail.com</p>
    `, 'Order processing notification email.')
  }),

  // ── TO CUSTOMER: Order out for delivery ───────────────────────
  orderOutForDelivery: ({ order, customer }) => ({
    to: customer.email,
    subject: `Out for Delivery! Your Order #${order.orderNumber} Arrives Today 🚚 | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Your piece is almost home, ${customer.firstName}! 🚚</h2>
      <p>Exciting news! Your Arihant World order is out for delivery today. Please ensure someone is available to receive it.</p>
      <div class="info-box">
        <p><strong>Order:</strong> #${order.orderNumber}</p>
        <p><strong>Status:</strong> Out for Delivery</p>
        <p>⚠️ Please handle with care — your marble piece is fragile and has been packed securely.</p>
      </div>
      <a href="https://arihantdivinearts.in/orders" class="btn">View Order Details</a>
      <p>If you miss the delivery, our courier will attempt again. You can also contact us for assistance.</p>
      <p style="font-size:12px;color:#9a8a70;">📞 +91 98765 43210 &nbsp;|&nbsp; ✉ arihantdivinearts@gmail.com</p>
    `, 'Out for delivery notification email.')
  }),

  // ── TO CUSTOMER: Welcome / Registration ───────────────────────
  welcome: ({ customer }) => ({
    to: customer.email,
    subject: `Welcome to Arihant World, ${customer.firstName}! 🙏`,
    html: baseTemplate(`
      <h2 class="greeting">Namaste, ${customer.firstName}! 🙏</h2>
      <p>Welcome to Arihant World – India's premier destination for handcrafted marble murtis, home temples & sacred décor.</p>
      <p>Your account has been created successfully. You can now:</p>
      <ul style="font-size:14px;line-height:2;color:#5a4a3a;padding-left:20px;margin:12px 0;">
        <li>Browse our exclusive collection of Makrana marble pieces</li>
        <li>Track your orders in real-time</li>
        <li>Save favourites to your wishlist</li>
        <li>Use wallet balance for faster checkout</li>
        <li>Request custom bespoke pieces</li>
      </ul>
      <a href="https://arihantdivinearts.in/products" class="btn">Explore Collections</a>
      <div class="info-box">
        <p>🎁 <strong>Welcome Offer:</strong> Use code <strong>WELCOME500</strong> to get ₹500 off your first order above ₹5,000.</p>
      </div>
    `, 'Welcome email for new account registration.')
  }),

  // ── TO CUSTOMER: Password Reset ────────────────────────────────
  passwordReset: ({ customer, resetUrl }) => ({
    to: customer.email,
    subject: `Reset Your Password | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Password Reset Request</h2>
      <p>We received a request to reset the password for your Arihant World account.</p>
      <p>Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      <div class="info-box">
        <p>⚠️ If you did not request this, you can safely ignore this email. Your account is secure.</p>
      </div>
      <p style="font-size:12px;color:#9a8a70;">If the button above doesn't work, copy and paste this link: <br>${resetUrl}</p>
    `, 'Password reset email – expires in 30 minutes.')
  }),

  // ── TO ADMIN: New Order ────────────────────────────────────────
  adminNewOrder: ({ order, customer }) => ({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'arihantdivinearts@gmail.com',
    subject: `🛒 New Order #${order.orderNumber} – ₹${(order.pricing?.total||0).toLocaleString('en-IN')} | ${customer.firstName} ${customer.lastName}`,
    html: baseTemplate(`
      <h2 class="greeting">🛒 New Order Received!</h2>
      <div class="info-box" style="background:#fff8e8;border-left:4px solid #b8973a;">
        <p style="font-size:18px;font-weight:bold;color:#b8973a;margin-bottom:8px;">Order #${order.orderNumber}</p>
        <p><strong>Date &amp; Time:</strong> ${new Date(order.createdAt||Date.now()).toLocaleString('en-IN',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
        <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
        <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${customer.phone || order.shippingAddress?.phone || 'N/A'}</p>
        <p><strong>Payment Method:</strong> ${(order.payment?.method||'').toUpperCase()}</p>
        ${order.payment?.codAdvanceAmount > 0 ? `<p><strong>COD Advance:</strong> ₹${order.payment.codAdvanceAmount.toLocaleString('en-IN')} (${order.payment.codAdvancePct}%)</p>` : ''}
      </div>

      <h3 style="font-family:Georgia,serif;font-size:16px;color:#2a2520;margin:20px 0 10px;">📦 Order Items</h3>
      <table class="order-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Size / Variant</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items||[]).map((item, idx) => `
          <tr>
            <td style="color:#9a8a70;">${idx+1}</td>
            <td><strong>${item.name||'—'}</strong></td>
            <td style="color:#b8973a;font-size:12px;">${item.variant || '—'}</td>
            <td style="text-align:center;">${item.qty}</td>
            <td>₹${(item.price||0).toLocaleString('en-IN')}</td>
            <td><strong>₹${((item.price||0)*(item.qty||1)).toLocaleString('en-IN')}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>

      <h3 style="font-family:Georgia,serif;font-size:16px;color:#2a2520;margin:20px 0 10px;">💰 Pricing Breakdown</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#5a4a3a;">Subtotal</td><td style="text-align:right;padding:6px 0;">₹${(order.pricing?.subtotal||0).toLocaleString('en-IN')}</td></tr>
        ${(order.pricing?.couponDiscount||0)>0?`<tr><td style="padding:6px 0;color:#22c55e;">Coupon Discount (${order.pricing?.couponCode||''})</td><td style="text-align:right;padding:6px 0;color:#22c55e;">−₹${(order.pricing.couponDiscount).toLocaleString('en-IN')}</td></tr>`:''}
        ${(order.pricing?.walletUsed||0)>0?`<tr><td style="padding:6px 0;color:#3b82f6;">Wallet Used</td><td style="text-align:right;padding:6px 0;color:#3b82f6;">−₹${(order.pricing.walletUsed).toLocaleString('en-IN')}</td></tr>`:''}
        <tr><td style="padding:6px 0;color:#5a4a3a;">Shipping</td><td style="text-align:right;padding:6px 0;">${(order.pricing?.shipping||0)===0?'FREE':'₹'+(order.pricing?.shipping||0).toLocaleString('en-IN')}</td></tr>
        <tr style="border-top:2px solid #b8973a;"><td style="padding:10px 0;font-size:16px;font-weight:bold;color:#2a2520;">TOTAL</td><td style="text-align:right;padding:10px 0;font-size:18px;font-weight:bold;color:#b8973a;">₹${(order.pricing?.total||0).toLocaleString('en-IN')}</td></tr>
      </table>

      <h3 style="font-family:Georgia,serif;font-size:16px;color:#2a2520;margin:20px 0 10px;">📍 Delivery Address</h3>
      <div class="info-box">
        <p><strong>${order.shippingAddress?.name||''}</strong></p>
        <p>${order.shippingAddress?.line1||''}${order.shippingAddress?.line2?', '+order.shippingAddress.line2:''}</p>
        <p>${order.shippingAddress?.city||''}, ${order.shippingAddress?.state||''} – ${order.shippingAddress?.pincode||''}</p>
        <p>📞 ${order.shippingAddress?.phone||customer.phone||'N/A'}</p>
      </div>

      ${order.notes ? `<div class="info-box" style="border-left-color:#ef4444;"><p><strong>📝 Customer Note:</strong> ${order.notes}</p></div>` : ''}

      <a href="${process.env.FRONTEND_URL||'http://localhost:3000'}/admin/orders" class="btn" style="margin-top:20px;">Open in Admin Panel →</a>
    `, 'Admin notification – new order placed.')
  }),

  // ── TO ADMIN: New Consultation ─────────────────────────────────
  adminConsultation: ({ consult }) => ({
    to: process.env.EMAIL_USER || 'arihantdivinearts@gmail.com',
    subject: `💬 New Consultation Request – ${consult.name}`,
    html: baseTemplate(`
      <h2 class="greeting">New Consultation Request</h2>
      <div class="info-box">
        <p><strong>Name:</strong> ${consult.name}</p>
        <p><strong>Phone:</strong> ${consult.phone}</p>
        <p><strong>Email:</strong> ${consult.email || 'Not provided'}</p>
        <p><strong>Interest:</strong> ${consult.interest || 'Not specified'}</p>
        <p><strong>Budget:</strong> ${consult.budget || 'Not specified'}</p>
        <p><strong>Message:</strong> ${consult.message || 'No message'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
      </div>
      <a href="https://arihantdivinearts.in/admin/consultations" class="btn">View in Admin</a>
    `, 'Admin notification – new consultation request.')
  }),

  // ── TO CUSTOMER: Wallet Credited ──────────────────────────────
  walletCredited: ({ customer, amount, description, balance }) => ({
    to: customer.email,
    subject: `₹${amount.toLocaleString('en-IN')} Added to Your Wallet | Arihant World`,
    html: baseTemplate(`
      <h2 class="greeting">Your Wallet has been Credited! 💰</h2>
      <div class="info-box">
        <p><strong>Amount Added:</strong> <span class="amount">+₹${amount.toLocaleString('en-IN')}</span></p>
        <p><strong>Reason:</strong> ${description}</p>
        <p><strong>New Balance:</strong> ₹${balance.toLocaleString('en-IN')}</p>
      </div>
      <p>Your wallet balance can be used at checkout to pay for your next order.</p>
      <a href="https://arihantdivinearts.in/wallet" class="btn">View My Wallet</a>
    `, 'Wallet credit notification.')
  }),
}

// ─── Main sendEmail function ───────────────────────────────────
const sendEmail = async ({ to, subject, html, templateSlug, variables } = {}) => {
  try {
    const transporter = createTransporter()

    // If templateSlug provided, use pre-built template
    let emailContent = { to, subject, html }
    if (templateSlug && templates[templateSlug]) {
      emailContent = templates[templateSlug](variables || {})
    }

    await transporter.sendMail({
      from: `"Arihant World" <${process.env.EMAIL_USER || 'arihantdivinearts@gmail.com'}>`,
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
    })
    console.log(`✅ Email sent: ${emailContent.subject} → ${emailContent.to}`)
    return { success: true }
  } catch(err) {
    console.error('❌ Email error:', err.message)
    return { success: false, error: err.message }
  }
}

// Export both the main function and templates
module.exports = sendEmail
module.exports.templates = templates
module.exports.sendEmail = sendEmail
