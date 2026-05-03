import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HomePage from '@/components/pages/HomePage'

export const metadata = {
  title: 'Arihant World – Premium Marble Artistry',
  description: 'Handcrafted murtis, temples & home décor by master artisans. Premium Makrana marble since 1985.',
}

export default function Page() {
  return (
    <>
      <Navbar />
      <HomePage />
      <Footer />
    </>
  )
}
