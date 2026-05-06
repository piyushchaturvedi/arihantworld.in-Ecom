'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { settingsAPI } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/config'

const SettingsContext = createContext({
  ...SITE_CONFIG,
  loaded: false,
  logoUrl: null,
})

export function useSettings() {
  return useContext(SettingsContext)
}

// ── Helper: merge API settings with static fallbacks ──────────────────────
const mergeSettings = (s) => ({
  name:          s.siteName      || SITE_CONFIG.name,
  tagline:       s.tagline       || SITE_CONFIG.tagline,
  description:   s.description   || SITE_CONFIG.description,
  logo:          s.logo          || SITE_CONFIG.logo,
  logoUrl:       s.logoUrl       || null,
  since:         s.since         || SITE_CONFIG.since,
  phone:         s.phone         || SITE_CONFIG.phone,
  whatsapp:      s.whatsapp      || SITE_CONFIG.whatsapp,
  email:         s.email         || SITE_CONFIG.email,
  address:       s.address       || SITE_CONFIG.address,
  currency:               s.currency               || '₹',
  freeShippingThreshold:  s.freeShippingThreshold  || 25000,
  gstPercent:             s.gstPercent             || 18,
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
  onlinePaymentDiscountPct: s.onlinePaymentDiscountPct ?? 5,
  onlinePaymentDiscountEnabled: s.onlinePaymentDiscountEnabled ?? true,
  onlinePaymentDiscountMsg: s.onlinePaymentDiscountMsg || '🎉 5% instant discount on Online Payment!',
  announcementBar:    s.announcementBar    || SITE_CONFIG.announcementBar || '',
  announcementActive: s.announcementActive ?? true,
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

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...SITE_CONFIG, loaded: false })
  const intervalRef = useRef(null)
  const failCount   = useRef(0)

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get()
      if (!data.settings) return
      setSettings(mergeSettings(data.settings))
      failCount.current = 0
    } catch {
      failCount.current += 1
      // Mark loaded on first failure so UI doesn't stay in skeleton state
      setSettings(prev => ({ ...prev, loaded: true }))
    }
  }

  useEffect(() => {
    // Immediate first fetch
    fetchSettings()

    // ✅ Background sync every 60 seconds
    // Backs off to every 5 min if API keeps failing (e.g. offline)
    const scheduleNext = () => {
      const delay = failCount.current >= 3 ? 5 * 60 * 1000 : 60 * 1000
      intervalRef.current = setTimeout(async () => {
        await fetchSettings()
        scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}
