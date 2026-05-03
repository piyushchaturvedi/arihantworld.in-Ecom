'use client'
import Link from 'next/link'
import { useSettings } from '@/components/providers/SettingsProvider'

export default function Footer() {
  const s = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-charcoal pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 border border-gold rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {s.logoUrl
                  ? <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain p-0.5"/>
                  : <span className="text-gold text-sm font-serif font-semibold">{s.logo || 'AW'}</span>}
              </div>
              <div>
                <div className="font-serif text-lg text-white">{s.name}</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-gold">{s.tagline}</div>
              </div>
            </div>
            <p className="text-stone/50 text-sm leading-relaxed">
              Premium marble murtis, home temples & décor crafted by master artisans since {s.since}.
            </p>
            <div className="flex gap-3 mt-6">
              {s.socials?.facebook && <a href={s.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 border border-white/10 flex items-center justify-center text-stone/50 hover:border-gold hover:text-gold transition-all text-xs">f</a>}
              {s.socials?.instagram && <a href={s.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 border border-white/10 flex items-center justify-center text-stone/50 hover:border-gold hover:text-gold transition-all text-xs">in</a>}
              {s.socials?.youtube && <a href={s.socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 border border-white/10 flex items-center justify-center text-stone/50 hover:border-gold hover:text-gold transition-all text-xs">yt</a>}
            </div>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-white text-xs tracking-[0.3em] uppercase mb-5">Menu</h4>
            <ul className="space-y-3">
              {[['Home','/'],['Collections','/products'],['Murtis','/category/murtis'],['Home Temples','/category/temples'],['Furniture','/category/furniture'],['Home Decor','/category/decor']].map(([l,h]) => (
                <li key={l}><Link href={h} className="text-stone/50 text-sm hover:text-gold transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white text-xs tracking-[0.3em] uppercase mb-5">Customer Service</h4>
            <ul className="space-y-3">
              {[['Contact Us','/#contact'],['Track Order','/orders'],['Return Policy','/privacy'],['Shipping Info','/privacy'],['Custom Orders','/#contact'],['FAQ','/#faq'],['Login','/auth/login'],['Sign Up','/auth/signup']].map(([l,h]) => (
                <li key={l}><Link href={h} className="text-stone/50 text-sm hover:text-gold transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="text-white text-xs tracking-[0.3em] uppercase mb-5">Stay Connected</h4>
            <p className="text-stone/50 text-sm mb-4 leading-relaxed">Get exclusive offers, new arrivals & spiritual guides in your inbox.</p>
            <form onSubmit={e => e.preventDefault()} className="flex mb-6">
              <input type="email" placeholder="Your email" required className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-xs text-stone placeholder-stone/30 outline-none focus:border-gold transition-colors min-w-0"/>
              <button type="submit" className="bg-gold text-white px-3 py-2.5 text-xs hover:bg-gold-dark transition-colors flex-shrink-0">→</button>
            </form>
            <div className="space-y-2.5 text-sm">
              {s.phone && (
                <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-stone/50 hover:text-gold transition-colors">
                  <span className="text-gold text-xs">📞</span>{s.phone}
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-stone/50 hover:text-gold transition-colors">
                  <span className="text-gold text-xs">✉</span>{s.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone/30">
          <p>© {year} {s.name}. All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link href="/privacy" className="hover:text-gold transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gold transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
