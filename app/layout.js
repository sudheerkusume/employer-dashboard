'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderNav from "./components/common/header";
import MainNavbar from "./components/common/mainnavbar";
import RootContext from "./components/config/rootcontext";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {

  const [rootContext, setRootContext] = useState({
    authenticated: false,
    loader: true,
    user: {
      name: "",
      email: "",
      mobile: "",
      role: "",
      password: "",
      token: "",
      isAdmin: "",
    },
    active: 'All',
    toast: {
      show: false,
      dismiss: true,
      type: '',
      title: '',
      message: ''
    }
  });

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#D79A2F]`}>
        <RootContext.Provider value={{ rootContext, setRootContext }}>
          <div className="relative">
            <HeaderNav />
            {/* MainNavbar attached to bottom of HeaderNav */}
            <div className="sm:absolute w-full sm:inset-x-0 sm:-bottom-8 sm:flex sm:justify-center">
              <MainNavbar />
            </div>
          </div>
          {children}
        </RootContext.Provider>
      </body>
    </html>
  );
}
