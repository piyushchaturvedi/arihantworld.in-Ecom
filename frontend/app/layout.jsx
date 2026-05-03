import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import SettingsProvider from '@/components/providers/SettingsProvider'
import PageTransition from '@/components/providers/PageTransition'

const SITE = {
  name: 'Arihant World',
  tagline: 'Premium Marble Artistry',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://arihantworld.com',
  description: 'Handcrafted marble murtis, home temples & décor by third-generation artisans. Premium Makrana marble since 1985. Free shipping above ₹25,000. Pan India & worldwide delivery.',
  keywords: 'marble murti, marble idol, home temple, marble mandir, makrana marble, marble decor, marble fountain, ganesha murti, radha krishna murti, marble handicraft, Arihant World',
}

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} – ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} – ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: '/og-image.jpg', width:1200, height:630, alt: `${SITE.name} – Premium Marble Artistry` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} – ${SITE.tagline}`,
    description: SITE.description,
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: SITE.url },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  other: {
    'geo.region': 'IN-RJ',
    'geo.placename': 'Makrana, Rajasthan, India',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2a2520',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preconnect for Google Fonts — reduces font load time */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        {/* Load only needed font weights — reduces by ~60KB */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": SITE.name,
            "url": SITE.url,
            "logo": `${SITE.url}/logo.png`,
            "description": SITE.description,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Makrana",
              "addressRegion": "Rajasthan",
              "postalCode": "341505",
              "addressCountry": "IN"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["English","Hindi"]
            },
            "sameAs": [
              "https://facebook.com/arihantworld",
              "https://instagram.com/arihantworld",
              "https://youtube.com/arihantworld"
            ]
          })}}
        />
        {/* Structured data — WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": SITE.name,
            "url": SITE.url,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${SITE.url}/products?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}}
        />
        {/* Razorpay — preload for faster checkout */}
        <link rel="preload" href="https://checkout.razorpay.com/v1/checkout.js" as="script"/>
      </head>
      <body>
        <SettingsProvider>
          <PageTransition />
          {children}
        </SettingsProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2a2520', color: '#e8dfd0',
              borderLeft: '4px solid #b8973a',
              fontFamily: 'Jost, sans-serif', fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#b8973a', secondary: '#fff' } },
            error: { style: { borderLeft: '4px solid #ef4444' }, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
