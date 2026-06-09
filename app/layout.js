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
      isActive: true,
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
  console.log("rootContext", rootContext)
  const [accessDenied, setAccessDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // <-- prevents flash

  useEffect(() => {
    const checkAuth = async () => {
      let localUser = null;
      const storedUserStr = localStorage.getItem("user_details");

      if (storedUserStr) {
        try {
          localUser = JSON.parse(storedUserStr);
        } catch (e) {
          localStorage.removeItem("user_details");
        }
      }

      if (!localUser) {
        // No user found, redirect to login
        setRootContext((prev) => ({ ...prev, loader: false }));
        if (!pathname.startsWith("/login")) {
          router.push("/login");
        }
        setIsChecking(false);
        return;
      }

      let activeUserData = null;

      // If Super Admin, use static data
      if (localUser.role === "super_admin") {
        activeUserData = {
          _id: "super_admin_001",
          name: "Admin",
          email: "superadmin@realbeez.com",
          mobile: "9999999999",
          password: "Superadmin@123",
          role: "super_admin",
          isActive: true
        };
      } else {
        // Fetch fresh employee data from API to check isActive
        try {
          const res = await fetch(`/api/employees?id=${localUser.userId || localUser._id}`);
          const data = await res.json();
          if (data && !data.error) {
            activeUserData = data;
          }
        } catch (err) {
          console.error("Error fetching employee data", err);
        }
      }

      if (!activeUserData || !activeUserData.isActive) {
        // Employee is inactive or not found
        setRootContext((prev) => ({
          ...prev,
          toast: {
            show: true,
            dismiss: true,
            type: "error",
            title: "Access Denied",
            message: "Your account is inactive. Please contact admin.",
          },
        }));
        localStorage.removeItem("user_details");
        setRootContext((prev) => ({ ...prev, loader: false, authenticated: false, user: null }));
        if (!pathname.startsWith("/login")) {
          router.push("/login");
        }
        setIsChecking(false);
        return;
      }

      const role = activeUserData.role?.toLowerCase() || "";

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

      setRootContext((prev) => ({
        ...prev,
        authenticated: true,
        loader: false,
        user: activeUserData,
      }));

      // Redirect away from login if already authenticated
      if (pathname === "/login" || pathname === "/") {
        if (role === "employee") router.push("/dashboard/employee");
        else if (role === "admin" || role === "super_admin") router.push("/dashboard/admin");
        else router.push("/dashboard/manager");
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  // 🔄 Polling effect: Automatically logout if admin deactivates the user while they are logged in
  useEffect(() => {
    const storedUserStr = typeof window !== "undefined" ? localStorage.getItem("user_details") : null;
    if (!storedUserStr) return;

    let localUser = null;
    try {
      localUser = JSON.parse(storedUserStr);
    } catch (e) {
      return;
    }

    // Super admin is always active, no need to poll
    if (!localUser || localUser.role === "super_admin") return;

    const checkActiveStatus = async () => {
      try {
        const res = await fetch(`/api/employees?id=${localUser.userId || localUser._id}`);
        const data = await res.json();

        // If API says the user is no longer active
        if (data && data.isActive === false) {
          localStorage.removeItem("user_details");

          setRootContext((prev) => ({
            ...prev,
            authenticated: false,
            user: null,
            toast: {
              show: true,
              dismiss: true,
              type: "error",
              title: "Account Disabled",
              message: "Your account has been deactivated by an admin.",
            },
          }));

          if (!window.location.pathname.startsWith("/login")) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Error polling user active status", err);
      }
    };

    // Check every 15 seconds
    const intervalId = setInterval(checkActiveStatus, 15000);
    return () => clearInterval(intervalId);
  }, [router]);

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