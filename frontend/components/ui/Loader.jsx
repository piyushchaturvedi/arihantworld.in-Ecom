'use client'

export default function Loader({ fullPage = false, text = 'Loading…' }) {
  if (fullPage) return (
    <div className="fixed inset-0 bg-cream/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-stone"></div>
        <div className="absolute inset-0 rounded-full border-2 border-t-gold animate-spin"></div>
        <div className="absolute inset-3 rounded-full border border-gold/20"></div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="w-8 h-px bg-gold"></span>
        <span className="text-warm/60 text-xs tracking-widest uppercase">{text}</span>
        <span className="w-8 h-px bg-gold"></span>
      </div>
    </div>
  )

  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-stone"></div>
        <div className="absolute inset-0 rounded-full border-2 border-t-gold animate-spin"></div>
      </div>
    </div>
  )
}

export function AdminLoader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="relative w-10 h-10 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-gray-100"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-gold animate-spin"></div>
        </div>
        <p className="text-gray-400 text-xs mt-3 tracking-widest uppercase">{text}</p>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader fullPage />
    </div>
  )
}
