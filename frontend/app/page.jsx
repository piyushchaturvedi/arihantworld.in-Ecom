import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HomePage from '@/components/pages/HomePage'

export const metadata = {
  title: 'Arihant World – Premium Marble Artistry',
  description: 'Handcrafted murtis, temples & home décor by master artisans. Premium Makrana marble since 1985.',
}

// Products data 2MB+ hoti hai (base64 images) — Next.js cache limit exceed hoti thi.
// SSR fetch band kar diya, client-side fetch (useEffect) se images aati hain.
// Backend mein in-memory cache hai toh client fetch bhi fast hoga (~50ms).

export default function Page() {
  return (
    <>
      <Navbar />
      <HomePage />
      <Footer />
    </>
  )
}
