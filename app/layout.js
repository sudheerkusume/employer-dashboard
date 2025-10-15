'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import Toast from "./components/common/toast";
import { useParams, usePathname } from "next/navigation";
import RootContext from "./components/config/rootcontext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const { project_id } = useParams();
  const pathname = usePathname();
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
    active: 'all',
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
          {children}
          {rootContext?.toast && <Toast />}
        </RootContext.Provider>
      </body>
    </html>
  );
}
