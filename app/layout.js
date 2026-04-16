'use client';
import { Inter } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import Toast from "./components/common/toast";
import { usePathname, useRouter } from "next/navigation";
import RootContext from "./components/config/rootcontext";
import Head from "next/head";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
    active: "all",
    toast: {
      show: false,
      dismiss: true,
      type: "",
      title: "",
      message: "",
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");

    if (storedUser) {
      const userData = JSON.parse(storedUser);

      setRootContext((prev) => ({
        ...prev,
        authenticated: true,
        loader: false,
        user: userData,
      }));
    } else {
      setRootContext((prev) => ({ ...prev, loader: false }));
    }
  }, [pathname, router]);

  return (
    <html lang="en">
      <Head>
        <title>Real Beez</title>
        <meta name="description" content="Realbeez Holding Pvt Ltd" />
      </Head>
      <body className={`${inter.className} antialiased bg-[#D79A2F]`}>
        <RootContext.Provider value={{ rootContext, setRootContext }}>
          {children}
          {rootContext?.toast?.show && <Toast />}
        </RootContext.Provider>
      </body>
    </html>
  );
}