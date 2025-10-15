'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import Toast from "./components/common/toast";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const router = useRouter();

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

  // ✅ Check localStorage for user details
  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");
    if (storedUser) {
      setRootContext(prev => ({
        ...prev,
        authenticated: true,
        loader: false,
        user: JSON.parse(storedUser),
      }));
    } else {
      setRootContext(prev => ({ ...prev, loader: false }));
      if (!pathname.startsWith("/login")) {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  // Show loader while checking localStorage
  if (rootContext.loader) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#D79A2F]`}>
        <RootContext.Provider value={{ rootContext, setRootContext }}>
          {children}
          {rootContext?.toast?.show && <Toast />}
        </RootContext.Provider>
      </body>
    </html>
  );
}
