// 'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/config'
import { useSettings } from '@/components/providers/SettingsProvider'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  const sections = [
    { id:'overview', title:'1. Overview', content:`${SITE_CONFIG.name} is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase. We only collect data necessary to provide our services and never sell your personal information.` },
    { id:'collection', title:'2. Data We Collect', content:'We collect: full name, email, phone number, shipping address, payment info (via PCI-DSS compliant gateways — we never store card numbers), order history, and browsing behavior (cookies, IP address, device info).' },
    { id:'usage', title:'3. How We Use It', content:'Your data is used to: process and fulfill orders, send order updates, personalize your experience, send promotional emails (only if opted in), analyze website traffic, and comply with legal obligations (GST records for 7 years).' },
    { id:'sharing', title:'4. Data Sharing', content:'We share data only with: payment processors (Razorpay, PayU), logistics partners (Blue Dart, DTDC, Delhivery), and email service providers. All partners are contractually bound to protect your data. We never sell your data to third parties.' },
    { id:'cookies', title:'5. Cookies', content:'We use essential cookies (cart, login), functional cookies (preferences), analytics cookies (Google Analytics), and marketing cookies (Google Ads, Facebook Pixel). You can control cookies through your browser settings.' },
    { id:'rights', title:'6. Your Rights', content:'You have the right to: access your data, correct inaccuracies, request deletion, opt out of marketing, and receive your data in portable format. Contact us at privacy@arihantworld.com to exercise these rights. We respond within 30 days.' },
    { id:'security', title:'7. Data Security', content:'We implement 256-bit SSL encryption, PCI-DSS compliant payment processing, encrypted password storage (bcrypt), and regular security audits. In case of a breach, we notify affected users within 72 hours.' },
    // { id:'contact-us', title:'8. Contact Us', content:`For privacy questions: ${useSettings?.email } | ${useSettings?.phone } | ${useSettings?.address }` },
  ]

  return (
    <>
      <Navbar />
      <div className="pt-28 pb-12 bg-charcoal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-stone/40 text-xs tracking-widests uppercase mb-4">
            <Link href="/" className="hover:text-gold">Home</Link><span>›</span>
            <span className="text-gold">Privacy Policy</span>
          </div>
          <h1 className="font-serif text-5xl text-white">Privacy Policy</h1>
          <p className="text-stone/50 text-sm mt-3">Last updated: January 1, 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-stone/30 border border-stone p-6 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[['🚫','Never sell your data'],['🔒','256-bit SSL'],['✋','You control your data'],['📧','Easy opt-out']].map(([i,l]) => (
            <div key={l}><div className="text-gold text-2xl mb-1">{i}</div><p className="text-[10px] tracking-widests uppercase text-warm/70">{l}</p></div>
          ))}
        </div>

        <div className="space-y-10">
          {sections.map(s => (
            <div key={s.id} id={s.id}>
              <h2 className="font-serif text-2xl text-charcoal border-b border-stone pb-3 mb-4">{s.title}</h2>
              <p className="text-warm/70 text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
