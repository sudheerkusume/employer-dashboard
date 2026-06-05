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

  const [accessDenied, setAccessDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // <-- prevents flash

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");
    let userData = null;

    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (e) {
        console.error("Invalid JSON in localStorage", e);
        localStorage.removeItem("user_details");
      }
    }

    const role = userData?.role?.toLowerCase?.() || "";

    // 🚫 Role-based access control
    const restrictedPaths = {
      admin: ["/dashboard/employee", "/dashboard/manager"],
      employee: ["/dashboard/admin", "/dashboard/manager"],
      manager: ["/dashboard/admin", "/dashboard/employee"],
    };

    const currentPath = pathname.toLowerCase();
    const isRestricted = restrictedPaths[role]?.some((restrictedPath) =>
      currentPath.includes(restrictedPath)
    );

    setAccessDenied(!!isRestricted);

    if (userData && role) {
      // User is logged in
      setRootContext((prev) => ({
        ...prev,
        authenticated: true,
        loader: false,
        user: userData,
      }));
    } else {
      // No valid user → redirect to login (unless already on login page)
      setRootContext((prev) => ({ ...prev, loader: false }));
      if (!pathname.startsWith("/login")) {
        router.push("/login");
        setIsChecking(false);
        return;
      }
    }

    setIsChecking(false);
  }, [pathname, router]);

  // Show a full‑page loader while checking authentication
  if (isChecking) {
    return (
      <html lang="en">
        <Head>
          <title>Real Beez</title>
          <meta name="description" content="Realbeez Holding Pvt Ltd" />
        </Head>
        <body className={`${inter.className} antialiased bg-[#D79A2F] w-full h-screen`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center text-white text-xl">Loading...</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <Head>
        <title>Real Beez</title>
        <meta name="description" content="Realbeez Holding Pvt Ltd" />
      </Head>
      <body className={`${inter.className} antialiased bg-[#D79A2F]`}>
        <RootContext.Provider value={{ rootContext, setRootContext }}>
          {accessDenied ? (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
                <p className="text-gray-600">
                  You don’t have permission to view this page.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
          {rootContext?.toast?.show && <Toast />}
        </RootContext.Provider>
      </body>
    </html>
  );
}