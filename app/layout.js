import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Inter } from 'next/font/google'
import Script from "next/script";
import IdentityProvider from "@/app/providers/identity-provider";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";


const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});


export const metadata = {
  title: {
    default: "Mapogram - Interactive Location-Based Platform for News, Jobs & Community",
    template: '%s | Mapogram'
  },
  description: "Discover everything happening around you with Mapogram. Explore news, job opportunities, community issues, and join communities on interactive maps. View local content within 10km, find jobs, report community issues, and engage with location-based communities - all on one platform.",
  keywords: [
    "mapogram", "location-based platform", "interactive map", "map layers",
    "local news", "nearby news", "news on map", "breaking news", "hyperlocal news",
    "job map", "local jobs", "job opportunities", "gig work", "internships", "job posting",
    "community issues", "city problems", "citizen reporting", "local governance",
    "communities", "join communities", "community engagement", "location-based communities",
    "location-based jobs", "map-based news", "interactive news map", "geo-tagged content",
    "neighborhood platform", "local discovery", "area-specific content",
    "hyperlocal platform", "location intelligence", "geographic information", "spatial data",
    "real-time map updates", "layered map interface", "multi-layer mapping", "location services"
  ],
  authors: [{ name: "Mapogram Team" }],
  creator: "Mapogram",
  publisher: "Mapogram",
  metadataBase: new URL('https://www.mapogram.co'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Mapogram - Interactive Location-Based Platform for News, Jobs & Community",
    description: "Discover everything happening around you with Mapogram. Explore news, job opportunities, community issues, and join communities on interactive maps. View local content within 10km, find jobs, report community issues, and engage with location-based communities - all on one platform.",
    url: 'https://www.mapogram.co',
    siteName: 'Mapogram',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.mapogram.co/images/mapogram.png',
        width: 1200,
        height: 630,
        alt: 'Mapogram - Interactive Location-Based Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mapogram', // Update your Twitter handle
    creator: '@mapogram', // Update your Twitter handle
    title: "Mapogram - Interactive Location-Based Platform for News, Jobs & Community",
    description: "Discover everything happening around you with Mapogram. Explore news, job opportunities, community issues, and join communities on interactive maps. View local content within 10km, find jobs, report community issues, and engage with location-based communities - all on one platform.",
    images: ['https://www.mapogram.co/images/mapogram.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  // verification: {
  //   google: 'your-google-site-verification-code', // Add when you get it
  //   // yandex: 'your-yandex-verification-code',
  //   // bing: 'your-bing-verification-code',
  // },
  category: 'technology',
  classification: 'Location-Based Services and Community Platform',
  other: {
    'pinterest': 'nopin',
    'fb:app_id': 'your-facebook-app-id', // Replace with your actual FB app ID
    'linkedin:share': 'true',
    'theme-color': '#991b1b', // Your app's primary red-800 color
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Mapogram',
  },
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          data-domain="mapogram.co"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${poppins.className} min-h-screen`}>
        <SessionProviderWrapper>
          <IdentityProvider>
            <Toaster />
            {children}
          </IdentityProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}