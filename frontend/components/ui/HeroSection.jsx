'use client'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="hero-bg absolute inset-0 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-10"></div>

      {/* Decorative lines */}
      <div className="absolute top-1/4 left-8 w-px h-32 bg-gradient-to-b from-transparent via-gold to-transparent opacity-60 z-20"></div>
      <div className="absolute top-1/4 right-8 w-px h-32 bg-gradient-to-b from-transparent via-gold to-transparent opacity-60 z-20"></div>

      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto fade-up">
        <div className="inline-flex items-center gap-4 mb-8">
          <span className="w-12 h-px bg-gold"></span>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-sans">Since 1985 · Arihant World</span>
          <span className="w-12 h-px bg-gold"></span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05] mb-6">
          <span className="block">Divine</span>
          <span className="block italic text-gold-light">Craftsmanship</span>
          <span className="block">in Marble</span>
        </h1>
        <p className="text-stone/80 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto mb-10 leading-relaxed">
          Handcrafted murtis, temples & home décor by master artisans — where sacred tradition meets timeless artistry.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="px-10 py-4 bg-gold text-white text-sm tracking-[0.2em] uppercase hover:bg-gold-dark transition-all duration-300 inline-block">
            Explore Collections
          </Link>
          <Link href="/#about" className="px-10 py-4 border border-white/40 text-white text-sm tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-all duration-300 inline-block">
            Our Story
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-stone/40 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-stone/40 to-transparent"></div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm py-3 overflow-hidden">
        <div className="marquee-track flex gap-16 text-stone/30 text-[10px] tracking-[0.4em] uppercase">
          {['Makrana Marble','Sacred Artistry','Master Craftsmen','Since 1985','Custom Orders','Free Consultation','Pan India Delivery','Vastu Certified',
            'Makrana Marble','Sacred Artistry','Master Craftsmen','Since 1985','Custom Orders','Free Consultation','Pan India Delivery','Vastu Certified'].map((t, i) => (
            <span key={i} className="flex-shrink-0">◈ {t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
