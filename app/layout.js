'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderNav from "./components/common/header";
import MainNavbar from "./components/common/mainnavbar";
import RootContext from "./components/config/rootcontext";
import { useState } from "react";
import HeroSection from "./components/home/herosection";

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
          <div className="relative w-full">
            <HeaderNav />
            <div className="relative">
              <div className="w-full sm:w-[70%] mx-auto z-50
                              sm:absolute sm:left-1/2 sm:-translate-x-1/2 
                              sm:-top-10">
                <MainNavbar />
              </div>
              <div className="w-full sm:rounded-lg mt-4 sm:mt-0">
                <HeroSection />
              </div>
            </div>
          </div>
          {children}
        </RootContext.Provider>
      </body>
    </html>
  );
}
