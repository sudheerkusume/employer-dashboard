"use client";
import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import RootContext from "@/app/components/config/rootcontext";
import EodModal from "@/app/components/EodModal";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight
} from "lucide-react";

import { useSWRFetch } from "@/app/components/config/useswrfetch";

export default function ManagerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [userId, setUserId] = useState(null);
  const [showEveningModal, setShowEveningModal] = useState(false);
  const [todayPlan, setTodayPlan] = useState(null);

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  // Fetch real-time data so badges update immediately after approvals
  const { data: managerData } = useSWRFetch(userId ? `/api/employees?id=${userId}` : null);
  const { data: allEmployeesData } = useSWRFetch("/api/employees");
  const { data: globalSettings } = useSWRFetch("/api/settings");

  const pendingLeavesCount = managerData?.pendingLeaves?.length || 0;
  const pendingARsCount = managerData?.pendingRegularizations?.length || 0;

  const pendingWFHCount = React.useMemo(() => {
    if (!allEmployeesData) return 0;
    let count = 0;
    allEmployeesData.forEach(emp => {
      if (emp.role === "admin" || emp.role === "super_admin") return;
      const wfhRequests = emp.wfhRequests || [];
      count += wfhRequests.filter(req => req.status === "pending").length;
    });
    return count;
  }, [allEmployeesData]);

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return "HR";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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

  const handleLogout = async () => {
    if (userId) {
      try {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const res = await fetch(`/api/eod?role=employee&id=${userId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.reports) {
          const todaysReport = data.reports.find(report => report.date === today);
          if (todaysReport) {
            setTodayPlan(todaysReport);

            let morningTasks = [];
            if (todaysReport.morningPlan) {
              if (todaysReport.morningPlan.includes('<')) {
                const doc = new DOMParser().parseFromString(todaysReport.morningPlan, 'text/html');
                const listItems = doc.querySelectorAll('body > ul > li, body > ol > li');
                if (listItems.length > 0) {
                  morningTasks = Array.from(listItems).map(li => li.textContent.trim());
                } else {
                  morningTasks = [doc.body.textContent.trim()];
                }
              } else {
                morningTasks = todaysReport.morningPlan.split('\n').filter(l => l.trim());
              }
            }

            const eveningUpdate = todaysReport.eveningUpdate || '';
            let allTasksAddressed = true;
            if (morningTasks.length > 0) {
              for (const task of morningTasks) {
                const cleanTask = task.replace(/^\[ROLLOVER\]\s*/, '');
                if (!eveningUpdate.includes(cleanTask)) {
                  allTasksAddressed = false;
                  break;
                }
              }
            } else {
              if (eveningUpdate.trim() === '') allTasksAddressed = false;
            }

            if (allTasksAddressed && eveningUpdate.trim() !== '') {
              actualLogoutFunction();
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest plan before logout:", err);
      }
    }
    setShowEveningModal(true);
  };

  const actualLogoutFunction = () => {
    localStorage.clear();
    setRootContext((prev) => ({ ...prev, authenticated: false }));
    router.push("/");
  };

  const submitEveningEod = async (formData) => {
    const user_details = JSON.parse(localStorage.getItem("user_details") || "{}");
    const payload = {
      employeeId: user_details?._id || user_details?.userCode || user_details?.userId || 'unknown_id',
      employeeName: user_details?.fullName || user_details?.name || 'Manager',
      department: user_details?.designation || user_details?.role || 'Manager',
      managerId: null,
      ...formData
    };
    try {
      const res = await fetch('/api/eod', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowEveningModal(false);
        actualLogoutFunction();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard/manager", icon: LayoutDashboard },
        { name: "My Team", href: "/dashboard/manager/team", icon: Users },
        { name: "Attendance", href: "/dashboard/manager/attendance", icon: CalendarCheck },
      ]
    },
    {
      title: "APPROVALS",
      items: [
        { name: "Leave Requests", href: "/dashboard/manager/leaves", icon: Clock, badge: pendingLeavesCount },
        { name: "WFH Requests", href: "/dashboard/manager/wfh", icon: Clock, badge: pendingWFHCount },
        { name: "Regularizations", href: "/dashboard/manager/regularizations", icon: Clock, badge: pendingARsCount, badgeColor: "bg-purple-100 text-purple-700" },
      ]
    },
    {
      title: "REPORTS",
      items: [
        { name: "Analytics", href: "/dashboard/manager/analytics", icon: BarChart3 },
        ...(globalSettings?.eodEnabled !== false ? [{ name: "Team Reports", href: "/dashboard/manager/reports", icon: FileText }] : [])
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans">

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
              w-[280px] bg-white border-r border-gray-200
              flex flex-col h-full
            `}
          >
            {/* Sidebar Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img
                  src={require('../accets/logo.png').default?.src || require('../accets/logo.png')}
                  alt="Realbeez Logo"
                  className="w-9 h-9 rounded-lg shadow-sm flex-shrink-0 object-contain"
                />
                <div>
                  <h1 className="text-sm font-bold text-gray-900 leading-tight">Sales Beez</h1>
                  <p className="text-[11px] text-gray-500 font-medium">Manager portal</p>
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Sidebar Links */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      // Check active state
                      const isActive = pathname === item.href || (item.href !== "/dashboard/manager" && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      return (
                        <Link href={item.href} key={item.name}>
                          <div
                            onClick={() => isMobile && setIsSidebarOpen(false)}
                            className={`
                              flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group relative
                              ${isActive
                                ? "bg-gray-50 text-gray-900 font-bold"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"}
                            `}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeManagerTab"
                                className="absolute left-0 w-1 h-6 bg-gray-900 rounded-r-full"
                              />
                            )}

                            <div className="flex items-center gap-3">
                              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-gray-800" : "text-gray-400 group-hover:text-gray-600"} />
                              <span className="text-sm">{item.name}</span>
                            </div>

                            {item.badge !== undefined && item.badge > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-amber-100 text-amber-700'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Bottom Profile */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                    {getInitials(managerData?.name)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {managerData?.name || "Loading..."}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      {managerData?.email || managerData?.designation || "Loading..."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
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
          <div className="flex-1 text-center font-bold text-gray-900 text-sm">HRSphere <span className="text-gray-400 font-normal">Manager</span></div>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <EodModal
        type="evening"
        isOpen={showEveningModal}
        onClose={() => {
          setShowEveningModal(false);
          actualLogoutFunction();
        }}
        onSubmit={submitEveningEod}
        todayPlan={todayPlan}
      />
    </div>
  );
}
