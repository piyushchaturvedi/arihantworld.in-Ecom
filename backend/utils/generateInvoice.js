function generateInvoiceHTML(order, settings = {}) {
  const siteName  = settings.siteName  || 'Arihant World'
  const siteEmail = settings.email     || 'info@arihantworld.com'
  const sitePhone = settings.phone     || '+91 98765 43210'
  const siteWeb   = 'https://arihantworld.com'
  const gstin     = settings.gstin     || '08AWPPS1234A1Z2'
  const siteAddr  = settings.address   || 'Makrana, Nagaur District, Rajasthan – 341505, India'
  const logoUrl   = settings.logoUrl   || ''

  const sa = order.shippingAddress || {}
  const p  = order.pricing || {}
  const u  = order.user    || {}

  // Marble/stone HSN 6802 = 5% IGST. Prices are GST-inclusive.
  const taxRate    = 0.05
  const subtotalIncl = p.subtotal || 0
  const taxableVal   = Math.round(subtotalIncl / (1 + taxRate))
  const gstAmount    = subtotalIncl - taxableVal
  const couponDisc   = p.couponDiscount || 0
  const shipping     = p.shipping || 0
  const total        = p.total || 0
  const onlineDisc   = (order.payment?.method === 'razorpay' && settings.onlinePaymentDiscountEnabled)
    ? Math.round(subtotalIncl * (settings.onlinePaymentDiscountPct || 5) / 100) : 0
  const finalTotal = total

  // Number to words
  const w = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function n2w(n) {
    n = Math.round(n)
    if (n === 0) return 'Zero'
    if (n < 20) return w[n]
    if (n < 100) return t[Math.floor(n/10)] + (n%10 ? ' '+w[n%10] : '')
    if (n < 1000) return w[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+n2w(n%100) : '')
    if (n < 100000) return n2w(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+n2w(n%1000) : '')
    if (n < 10000000) return n2w(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+n2w(n%100000) : '')
    return n2w(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+n2w(n%10000000) : '')
  }
  const amtWords = n2w(finalTotal).toUpperCase() + ' RUPEES ONLY'

  const rows = (order.items || []).map(item => {
    const itemTotal   = item.price * item.qty
    const itemTaxable = Math.round(itemTotal / (1 + taxRate))
    const itemGst     = itemTotal - itemTaxable
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;font-size:12.5px;">${item.name}${item.variant ? ' – '+item.variant : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:center;font-size:12.5px;">${item.qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:right;font-size:12.5px;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:right;font-size:12.5px;">₹${itemTaxable.toLocaleString('en-IN')}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:center;font-size:12.5px;">6802</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:center;font-size:12.5px;">5%</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:right;font-size:12.5px;">₹${itemGst.toLocaleString('en-IN')}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;text-align:right;font-size:12.5px;font-weight:700;color:#b8973a;">₹${itemTotal.toLocaleString('en-IN')}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Invoice – ${order.orderNumber}</title>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:Arial,sans-serif; background:#fff; color:#2a2520; font-size:13px; }
.page { max-width:800px; margin:0 auto; border:1px solid #e0d8cc; background:#fff; }
/* ── TOP HEADER: logo + company info left, invoice details right ── */
.header { background:#2a2520; padding:0; }
.header-inner { display:flex; align-items:stretch; }
.header-logo  { padding:20px 24px; border-right:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:14px; flex-shrink:0; }
.logo-circle  { width:52px; height:52px; border:2px solid #b8973a; border-radius:50%; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
.logo-circle img { width:100%; height:100%; object-fit:contain; }
.logo-initials { color:#b8973a; font-size:18px; font-weight:700; font-style:italic; }
.company-info { color:white; }
.company-name { font-size:18px; font-weight:700; letter-spacing:1px; line-height:1.2; }
.company-sub  { font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#b8973a; margin-top:2px; }
.company-contact { font-size:11px; color:rgba(255,255,255,0.55); margin-top:6px; line-height:1.7; }
.header-meta  { padding:20px 24px; display:flex; flex-direction:column; justify-content:center; gap:3px; flex:1; }
.header-meta p { font-size:11.5px; color:rgba(255,255,255,0.7); }
.header-meta strong { color:white; }
.header-right { padding:20px 24px; text-align:right; display:flex; flex-direction:column; justify-content:center; gap:3px; flex-shrink:0; }
.header-right p { font-size:11.5px; color:rgba(255,255,255,0.7); }
.header-right strong { color:white; }
.gstin-tag { background:#b8973a; color:white; font-size:9px; letter-spacing:1px; text-transform:uppercase; padding:3px 8px; border-radius:2px; display:inline-block; margin-bottom:4px; }
/* ── ADDRESSES ── */
.addresses { display:grid; grid-template-columns:1fr 1fr 1fr; }
.addr-col   { padding:14px 16px; border-right:1px solid #e8dfd0; border-bottom:1px solid #e8dfd0; }
.addr-col:last-child { border-right:none; }
.addr-title { font-size:9px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:#2a2520; background:#f0e8d8; padding:4px 16px; margin:-14px -16px 10px; display:block; border-bottom:1px solid #e0d4bc; }
.addr-col p { font-size:11.5px; line-height:1.75; color:#4a3a2a; }
.addr-col strong { color:#2a2520; }
/* ── TABLE ── */
table.items { width:100%; border-collapse:collapse; border-top:2px solid #b8973a; }
table.items thead tr { background:#2a2520; }
table.items th { color:white; padding:9px 8px; text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
table.items th.c { text-align:center; }
table.items th.r { text-align:right; }
table.items tbody tr:hover { background:#faf7f2; }
.total-row td { background:#f5f0e8; font-weight:700; font-size:13px; padding:11px 8px; border-top:2px solid #b8973a; }
/* ── FOOTER SECTION ── */
.invoice-footer { display:flex; border-top:2px solid #b8973a; }
.footer-left  { flex:1; padding:18px 20px; border-right:1px solid #e8dfd0; }
.footer-right { min-width:270px; padding:18px 20px; }
.footer-left h4  { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#7a6040; margin-bottom:6px; }
.footer-left p   { font-size:12px; line-height:1.7; color:#4a3a2a; }
.amt-row { display:flex; justify-content:space-between; font-size:12px; padding:3px 0; color:#4a3a2a; }
.amt-row.grand  { font-size:14px; font-weight:700; color:#b8973a; padding-top:8px; margin-top:6px; border-top:2px solid #2a2520; }
.badge { background:#b8973a; color:white; font-size:8px; letter-spacing:1px; text-transform:uppercase; padding:1px 5px; border-radius:2px; margin-left:5px; vertical-align:middle; }
.stamp { text-align:center; padding:12px; background:#f9f7f3; border-top:1px solid #e8dfd0; font-size:10.5px; color:#9a8a70; font-style:italic; }
@media print { .page { border:none; } @page { margin:10mm; } }
</style></head><body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-inner">
      <!-- Left: Logo + Company -->
      <div class="header-logo">
        <div class="logo-circle">
          ${logoUrl
            ? `<img src="${logoUrl}" alt="${siteName}"/>`
            : `<span class="logo-initials">${(siteName||'AW').slice(0,2)}</span>`}
        </div>
        <div class="company-info">
          <div class="company-name">${siteName}</div>
          <div class="company-sub">Premium Stone Arts</div>
          <div class="company-contact">
            ${siteEmail}<br>
            ${siteWeb}<br>
            ${sitePhone}
          </div>
        </div>
      </div>
      <!-- Center: Invoice meta -->
      <div class="header-meta">
        <p><strong>TAX INVOICE</strong> &nbsp; <span style="font-size:10px;color:rgba(255,255,255,0.4);">Original</span></p>
        <p>Invoice No: <strong>${order.orderNumber}</strong></p>
        <p>Order ID: <strong>#${order.orderNumber}</strong></p>
        <p>Invoice Date: <strong>${new Date(order.createdAt||Date.now()).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</strong></p>
        <p>Payment: <strong>${(order.payment?.method||'ONLINE').toUpperCase()}</strong></p>
      </div>
      <!-- Right: GSTIN + Place of Supply -->
      <div class="header-right">
        <div class="gstin-tag">GSTIN: ${gstin}</div>
        <p style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Place of Supply</p>
        <p><strong>${sa.city||'India'}, ${sa.state||'India'}</strong></p>
      </div>
    </div>
  </div>

  <!-- ADDRESSES -->
  <div class="addresses">
    <div class="addr-col"><span class="addr-title">Billed To</span>
      <p><strong>${sa.name||`${u.firstName||''} ${u.lastName||''}`}</strong></p>
      <p>${sa.line1||''}${sa.line2?', '+sa.line2:''}</p>
      <p>${sa.city||''}, Pin: ${sa.pincode||''}, ${sa.state||''}, India</p>
      <p>Tel: ${sa.phone||u.phone||''}</p>
      <p>Email: ${u.email||''}</p>
    </div>
    <div class="addr-col"><span class="addr-title">Ship To</span>
      <p><strong>${sa.name||`${u.firstName||''} ${u.lastName||''}`}</strong></p>
      <p>${sa.line1||''}${sa.line2?', '+sa.line2:''}</p>
      <p>${sa.city||''}, Pin: ${sa.pincode||''}, ${sa.state||''}, India</p>
      <p>Tel: ${sa.phone||u.phone||''}</p>
    </div>
    <div class="addr-col"><span class="addr-title">Supplier</span>
      <p><strong>${siteName}</strong></p>
      <p>${siteAddr}</p>
      <p>Tel: ${sitePhone}</p>
      <p>Email: ${siteEmail}</p>
      <p style="margin-top:6px;"><span class="gstin-tag">GSTIN: ${gstin}</span></p>
    </div>
  </div>

  <!-- ITEMS -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:34%">Item</th>
        <th class="c">Qty</th>
        <th class="r">Rate</th>
        <th class="r">Taxable Val</th>
        <th class="c">HSN</th>
        <th class="c">GST</th>
        <th class="r">IGST</th>
        <th class="r">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td style="text-align:right">₹${taxableVal.toLocaleString('en-IN')}</td>
        <td></td><td></td>
        <td style="text-align:right">₹${gstAmount.toLocaleString('en-IN')}</td>
        <td style="text-align:right;color:#b8973a">₹${subtotalIncl.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="invoice-footer">
    <div class="footer-left">
      <h4>Terms and Conditions apply</h4>
      <br>
      <h4>Amount in words</h4>
      <p style="margin-top:4px">${amtWords}</p>
      <p style="margin-top:8px;font-style:italic;color:#9a8a70">E. &amp; O.E</p>
    </div>
    <div class="footer-right">
      ${couponDisc > 0 ? `<div class="amt-row"><span>Total Discount:</span><span>₹${couponDisc.toLocaleString('en-IN')} <span class="badge">COUPON</span></span></div>` : ''}
      ${onlineDisc > 0 ? `<div class="amt-row"><span>Online Discount (${settings.onlinePaymentDiscountPct||5}%):</span><span>₹${onlineDisc.toLocaleString('en-IN')} <span class="badge">PREPAID OFFER</span></span></div>` : ''}
      <div class="amt-row"><span>Total Amount before Tax:</span><span>₹${taxableVal.toLocaleString('en-IN')}</span></div>
      <div class="amt-row"><span>Total Tax Amount:</span><span>₹${gstAmount.toLocaleString('en-IN')}</span></div>
      <div class="amt-row"><span>Total Amount After Tax:</span><span>₹${subtotalIncl.toLocaleString('en-IN')}</span></div>
      <div class="amt-row"><span>Shipping Amount:</span><span>₹${shipping.toLocaleString('en-IN')}</span></div>
      <div class="amt-row"><span>Shipping IGST (0%):</span><span>₹0.00</span></div>
      <div class="amt-row"><span>Round Off</span><span>–</span></div>
      <div class="amt-row grand"><span>Total</span><span>₹${finalTotal.toLocaleString('en-IN')}</span></div>
    </div>
  </div>

  <div class="stamp">
    This is a computer generated invoice and hence no signature is required
  </div>
</div>
</body></html>`
}

module.exports = { generateInvoiceHTML }
