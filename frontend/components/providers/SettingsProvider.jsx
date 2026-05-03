'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { settingsAPI } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/config'

// Default context = static SITE_CONFIG (used if API fails / during SSR)
const SettingsContext = createContext({
  ...SITE_CONFIG,
  loaded: false,
  logoUrl: null,
})

export function useSettings() {
  return useContext(SettingsContext)
}

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...SITE_CONFIG, loaded: false })

  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => {
        if (!data.settings) return
        const s = data.settings
        setSettings({
          // Identity
          name:          s.siteName      || SITE_CONFIG.name,
          tagline:       s.tagline       || SITE_CONFIG.tagline,
          description:   s.description   || SITE_CONFIG.description,
          logo:          s.logo          || SITE_CONFIG.logo,
          logoUrl:       s.logoUrl       || null,
          since:         s.since         || SITE_CONFIG.since,
          // Contact
          phone:         s.phone         || SITE_CONFIG.phone,
          whatsapp:      s.whatsapp      || SITE_CONFIG.whatsapp,
          email:         s.email         || SITE_CONFIG.email,
          address:       s.address       || SITE_CONFIG.address,
          // Commerce
          currency:               s.currency               || '₹',
          freeShippingThreshold:  s.freeShippingThreshold  || 25000,
          gstPercent:             s.gstPercent             || 18,
          // Socials
          socials: {
            facebook:  s.facebook  || SITE_CONFIG.socials?.facebook,
            instagram: s.instagram || SITE_CONFIG.socials?.instagram,
            youtube:   s.youtube   || SITE_CONFIG.socials?.youtube,
            twitter:   s.twitter   || SITE_CONFIG.socials?.twitter,
          },
          gstin: s.gstin || '08AWPPS1234A1Z2',
          walletMaxUsePct: s.walletMaxUsePct ?? 100,
          walletEnabled: s.walletEnabled ?? true,
          walletExpiryDays: s.walletExpiryDays ?? 0,
          pincodeCheckerEnabled: s.pincodeCheckerEnabled ?? true,
          // Online payment discount (admin-manageable)
          onlinePaymentDiscountPct: s.onlinePaymentDiscountPct ?? 5,
          onlinePaymentDiscountEnabled: s.onlinePaymentDiscountEnabled ?? true,
          onlinePaymentDiscountMsg: s.onlinePaymentDiscountMsg || '🎉 5% instant discount on Online Payment!',
          // Announcement
          announcementBar:    s.announcementBar    || SITE_CONFIG.announcementBar || '',
          announcementActive: s.announcementActive ?? true,
          // Homepage content (from DB — admin-manageable)
          stats:        s.stats?.length        ? s.stats        : SITE_CONFIG.stats,
          testimonials: s.testimonials?.length ? s.testimonials : SITE_CONFIG.testimonials,
          process:      s.process?.length      ? s.process      : SITE_CONFIG.process,
          faqs:         s.faqs?.length         ? s.faqs         : SITE_CONFIG.faqs,
          categories:   s.categories?.length   ? s.categories   : SITE_CONFIG.categories,
          aboutImages: s.aboutImages?.length ? s.aboutImages : [],
          heroTitle:    s.heroTitle    || 'Divine Craftsmanship in Marble',
          heroSubtitle: s.heroSubtitle || 'Handcrafted marble murtis, home temples & décor by third-generation artisans. Since 1985.',
          heroCTA1:     s.heroCTA1    || 'Explore Collections',
          heroCTA2:     s.heroCTA2    || 'Our Story',
          heroTagline:  s.heroTagline || 'SINCE 1985 · MAKRANA MARBLE · THIRD-GENERATION ARTISANS',
          aboutTitle:   s.aboutTitle  || 'Where Sacred Art Meets Eternity',
          aboutText:    s.aboutText   || '',
          aboutText2:   s.aboutText2  || '',
          loaded: true,
        })
      })
      .catch(() => {
        // API unavailable — keep static defaults but mark loaded
        setSettings(prev => ({ ...prev, loaded: true }))
      })
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}
