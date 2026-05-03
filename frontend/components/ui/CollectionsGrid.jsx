import Link from 'next/link'

const collections = [
  { name: 'Murtis', icon: '🏺', href: '/products?category=murtis', desc: 'Divine marble idols' },
  { name: 'Home Temples', icon: '⛩️', href: '/products?category=temples', desc: 'Sacred mandirs' },
  { name: 'Furniture', icon: '🏛️', href: '/products?category=furniture', desc: 'Marble inlay tables' },
  { name: 'Decor', icon: '💐', href: '/products?category=decor', desc: 'Vases, bowls & diyas' },
  { name: 'Fountains', icon: '🌊', href: '/products?category=fountains', desc: 'Water features' },
  { name: 'Custom', icon: '✨', href: '/#contact', desc: 'Bespoke creations' },
]

export default function CollectionsGrid() {
  return (
    <section id="collections" className="py-24 bg-charcoal px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-tag">Explore</span>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Our Collections</h2>
          <p className="text-stone/60 max-w-xl mx-auto text-sm leading-relaxed">
            Each category represents centuries of craft tradition, passed down through generations of Rajasthani artisans.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {collections.map((c) => (
            <Link key={c.name} href={c.href}
              className="group flex flex-col items-center text-center p-5 border border-white/10 hover:border-gold hover:bg-gold/5 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 rounded-full border border-white/10 group-hover:border-gold flex items-center justify-center text-2xl mb-3 bg-white/3 group-hover:bg-gold/10 transition-all duration-300">
                {c.icon}
              </div>
              <p className="text-white text-xs tracking-[0.2em] uppercase mb-1">{c.name}</p>
              <p className="text-stone/40 text-[10px]">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
