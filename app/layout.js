import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap', // optional
});

export const metadata = {
  title: "RealBeez Holding Pvt Limited - Complete Real Estate Solutions | Property Sales, Leasing & Consultancy",
  description: "RealBeez offers comprehensive real estate services including property sales, leasing, legal verification, property valuation, consultancy, and property management. Your trusted partner for all real estate needs.",
  keywords: "real estate, property sales, property leasing, legal verification, property valuation, real estate consultancy, property management, RealBeez, real estate solutions, property services",
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
