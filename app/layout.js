'use client';
import { Inter } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import Toast from "./components/common/toast";
import { usePathname, useRouter } from "next/navigation";
import RootContext from "./components/config/rootcontext";

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

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");

    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const role = userData?.role?.toLowerCase?.() || "";

      // ✅ If user exists but role is missing, redirect to login
      if (!role) {
        router.push("/login");
        return;
      }

      const path = pathname.toLowerCase();

      setRootContext((prev) => ({
        ...prev,
        authenticated: true,
        loader: false,
        user: userData,
      }));

      // 🚫 Role-based access control
      const restrictedPaths = {
        admin: ["/dashboard/employee", "/dashboard/manager"],
        employee: ["/dashboard/admin", "/dashboard/manager"],
        manager: ["/dashboard/admin", "/dashboard/employee"],
      };

      const restricted = restrictedPaths[role]?.some((restrictedPath) =>
        path.includes(restrictedPath)
      );

      setAccessDenied(!!restricted);
    } else {
      // ✅ No user found → redirect to login
      setRootContext((prev) => ({ ...prev, loader: false }));
      if (!pathname.startsWith("/login")) {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  return (
    <html lang="en">
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
