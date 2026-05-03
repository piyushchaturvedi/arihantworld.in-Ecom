'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { useSettings } from '@/components/providers/SettingsProvider'

export default function AboutPage() {
  const s = useSettings()

  return (
    <>
      <Navbar/>
      {/* Hero */}
      <div className="pt-32 pb-20 bg-charcoal text-center px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[20rem] text-gold leading-none">◈</span>
        </div>
        <div className="relative max-w-3xl mx-auto">
          <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-4">Est. {s.since || '1985'}</span>
          <h1 className="font-serif text-5xl sm:text-6xl text-white leading-tight mb-6">{s.aboutTitle || 'Where Sacred Art Meets Eternity'}</h1>
          <p className="text-stone/60 text-lg leading-relaxed">{s.aboutText || 'At Arihant World, every piece is born from the same white Makrana marble that built the Taj Mahal.'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gold py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {(s.stats || []).map((st, i) => (
            <div key={i}>
              <div className="font-serif text-4xl sm:text-5xl text-white mb-1">{st.value}</div>
              <div className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/70">{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About content */}
      <section className="py-20 px-4 sm:px-6 bg-cream">
        <div className="max-w-4xl mx-auto space-y-8 text-warm/80 text-base leading-relaxed">
          <p className="text-lg">{s.aboutText || 'At Arihant World, every piece is born from the same white Makrana marble that built the Taj Mahal. Our master Shilpa Shastris — hereditary craftsmen — breathe devotion into every chisel stroke.'}</p>
          <p>{s.aboutText2 || 'Guided by Vastu principles and the science of sacred geometry, we don\'t merely make objects — we create spaces that elevate consciousness and invite the divine into your home.'}</p>
          <p>Our workshop in Makrana, Rajasthan sits at the heart of India's marble belt. Here, third-generation artisans — men and women who grew up watching their grandparents carve — continue traditions stretching back centuries. Every murti leaves our workshop only after passing our 12-point quality inspection.</p>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 sm:px-6 bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-3">Our Craft</span>
            <h2 className="font-serif text-4xl sm:text-5xl text-white">The Art of <em className="text-gold-light">Creation</em></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {(s.process || []).map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-xl text-gold">{step.num}</span>
                </div>
                <h4 className="font-serif text-base sm:text-lg text-white mb-2">{step.title}</h4>
                <p className="text-stone/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-cream text-center">
        <span className="text-gold text-xs tracking-[0.4em] uppercase block mb-4">Start Your Journey</span>
        <h2 className="font-serif text-4xl text-charcoal mb-4">Ready to find your sacred piece?</h2>
        <p className="text-warm/60 text-sm mb-8 max-w-md mx-auto">Every piece we create carries a lifetime of tradition. Let us help you find or create yours.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="btn-gold">Explore Collections</Link>
          <Link href="/#contact" className="px-8 py-3 border border-charcoal text-charcoal text-xs tracking-widests uppercase hover:bg-charcoal hover:text-white transition-all">Free Consultation</Link>
        </div>
      </section>
      <Footer/>
    </>
  )
}
