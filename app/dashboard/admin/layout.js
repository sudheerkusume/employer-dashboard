"use client";
import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import RootContext from "@/app/components/config/rootcontext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  FileText,
  Briefcase,
  CalendarDays,
  UserPlus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRootContext((prev) => ({ ...prev, authenticated: false }));
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Employees", href: "/dashboard/admin/employees", icon: Users },
    { name: "Attendance", href: "/dashboard/admin/attendance", icon: CalendarCheck },
    { name: "Leave Requests", href: "/dashboard/admin/leaves", icon: Clock },
    { name: "Payroll", href: "/dashboard/admin/payroll", icon: FileText },
    { name: "Departments", href: "/dashboard/admin/departments", icon: Briefcase },
    { name: "Holidays", href: "/dashboard/admin/holidays", icon: CalendarDays },
    // { name: "Recruitment", href: "/dashboard/admin/recruitment", icon: UserPlus },
    // { name: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || !isMobile) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={`
              fixed lg:static inset-y-0 left-0 z-50
              w-[280px] bg-white border-r border-gray-200 shadow-sm
              flex flex-col h-full
            `}
          >
            {/* Sidebar Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
                  R
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Real<span className="text-orange-500">beez</span></h1>
              </div>
              {isMobile && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Sidebar Links */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link href={item.href} key={item.name}>
                    <div
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                        ${isActive
                          ? "bg-orange-50 text-orange-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 w-1 h-8 bg-orange-500 rounded-r-full"
                        />
                      )}
                      <Icon size={20} className={isActive ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <div className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 text-center font-bold text-gray-900 text-lg">Real<span className="text-orange-500">beez</span></div>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
