import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap', // optional
});

export const metadata = {
  title: "RealBeez Holding Pvt Limited - Complete Real Estate Solutions | Property Sales, Leasing & Consultancy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  description: "RealBeez offers comprehensive real estate services including property sales, leasing, legal verification, property valuation, consultancy, and property management. Your trusted partner for all real estate needs.",
  keywords: "real estate, property sales, property leasing, legal verification, property valuation, real estate consultancy, property management, RealBeez, real estate solutions, property services",
  authors: [{ name: "RealBeez Holding Pvt Limited Team" }],
  openGraph: {
    title: "RealBeez Holding Pvt Limited - Complete Real Estate Solutions",
    description: "Your trusted partner for comprehensive real estate services including sales, leasing, legal verification, valuation, and property management.",
    url: "https://real-beez.com",
    siteName: "RealBeez Holding Pvt Limited",
    images: [
      {
        url: "/icons/dp.png",
        width: 800,
        height: 600,
        alt: "RealBeez Holding Pvt Limited - Complete Real Estate Solutions",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RealBeez Holding Pvt Limited - Complete Real Estate Solutions",
    description: "Professional real estate services for property sales, leasing, legal verification, valuation, and consultancy.",
    images: ["/icons/dp.png"],
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
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console code
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
