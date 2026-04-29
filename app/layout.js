'use client';
import { Inter } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Toast from "./components/common/toast";
import RootContext from "./components/config/rootcontext";
import Head from "next/head";
import Header from "./components/mlm/navbar";

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
      try {
        const userData = JSON.parse(storedUser);
        setRootContext((prev) => ({
          ...prev,
          authenticated: true,
          loader: false,
          user: userData,
          mlmUser: userData,
        }));
      } catch (e) {
        console.error("Failed to parse user_details", e);
        setRootContext((prev) => ({ ...prev, loader: false }));
      }
    } else {
      setRootContext((prev) => ({ ...prev, loader: false }));
    }
  }, []);

  // Super admin check
  const user = rootContext.user;
  const isSuperAdmin =
    user?.isSuperAdmin ||
    user?.role === "super_admin" ||
    user?.userCode === "SB000000";

  useEffect(() => {
    if (!rootContext.loader && pathname?.startsWith("/applicants")) {
      if (!isSuperAdmin) {
        router.replace("/");
      }
    }
  }, [rootContext.loader, pathname, isSuperAdmin, router]);

  if (rootContext.loader) {
    return (
      <html lang="en">
        <body className={`${inter.className} antialiased bg-[#D79A2F]`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </body>
      </html>
    );
  }

  const showHeader = rootContext?.user?.isLoggedIn || rootContext?.mlmUser?.isLoggedIn;

  return (
    <html lang="en">
      <Head>
        <title>Sales Beez</title>
        <meta name="description" content="Realbeez Holding Pvt Ltd" />
      </Head>
      <body className={`${inter.className} antialiased bg-[#D79A2F]`}>
        <RootContext.Provider value={{ rootContext, setRootContext }}>
          {showHeader && <Header />}
          <main className={`${showHeader && "mt-10"}`}>
            {children}
          </main>
          {rootContext?.toast?.show && <Toast />}
        </RootContext.Provider>
      </body>
    </html>
  );
}