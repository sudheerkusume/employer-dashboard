"use client";
import React, { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, UserCheck, UserX, Clock, Bell,
  Plus, CheckCircle, FileText, Download,
  Activity, Calendar, User
} from "lucide-react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import { format } from "date-fns";
import RootContext from "@/app/components/config/rootcontext";

export default function DashboardHome() {
  const [isClient, setIsClient] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingARs, setPendingARs] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user_details");
    let userData = null;
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
        if (userData.name) setUserName(userData.name);
      } catch (e) { }
    }
    setCurrentUserRole(userData?.role?.toLowerCase?.() || "");

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const { data: employeesData, isLoading: employeesLoading } = useSWRFetch("/api/employees");

  useEffect(() => {
    if (employeesData && (currentUserRole === "super_admin" || currentUserRole === "admin")) {
      const allPendingLeaves = employeesData.flatMap(emp => 
        (emp.leaveRequests || []).filter(lr => lr.status === "pending").map(lr => ({...lr, employeeName: emp.name}))
      );
      setPendingLeaves(allPendingLeaves);

      const allPendingARs = employeesData.flatMap(emp => 
        (emp.attendanceRegularizationRequests || []).filter(ar => ar.status === "pending").map(ar => ({...ar, employeeName: emp.name}))
      );
      setPendingARs(allPendingARs);
    }
  }, [employeesData, currentUserRole]);

  if (!isClient || employeesLoading) return <Loading />;

  // Calculate stats from real data
  const totalEmployees = employeesData ? employeesData.length : 0;
  let presentToday = 0;
  let onLeaveToday = 0;
  let lateCheckins = 0;
  let recentCheckins = [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const monthName = format(new Date(), "MMMM");

  if (employeesData) {
    employeesData.forEach(emp => {
      // Check Leaves
      const isOnLeave = (emp.leaves || []).some(leave =>
        leave.status === "approved" &&
        new Date(leave.startDate) <= new Date() &&
        new Date(leave.endDate) >= new Date()
      );

      if (isOnLeave) {
        onLeaveToday++;
      } else {
        // Check Attendance
        const monthData = emp.attendance?.[monthName] || [];
        const todayRecord = monthData.find(d => d.date === todayStr);
        if (todayRecord && (todayRecord.checkIn || todayRecord.status === "present")) {
          presentToday++;
          if (todayRecord.checkIn && todayRecord.checkIn > "09:30") {
            lateCheckins++;
          }
          if (todayRecord.checkIn) {
            recentCheckins.push({
              user: emp.name,
              action: `checked in at ${todayRecord.checkIn}`,
              time: "Today",
              type: "checkin"
            });
          }
        }
      }
    });
  }

  const pendingRequests = pendingLeaves.length + pendingARs.length;

  // Derive Activities
  const recentLeaves = pendingLeaves.slice(0, 3).map(leave => ({
    user: leave.employeeName,
    action: `applied for leave (${format(new Date(leave.startDate), "MMM dd")})`,
    time: "Pending",
    type: "leave"
  }));

  const recentARs = pendingARs.slice(0, 2).map(ar => ({
    user: ar.employeeName,
    action: "requested regularization",
    time: "Pending",
    type: "ar"
  }));

  const recentActivities = [...recentCheckins.slice(0, 2), ...recentLeaves, ...recentARs];

  // Calculate percentages
  const presentPercent = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const leavePercent = totalEmployees ? Math.round((onLeaveToday / totalEmployees) * 100) : 0;
  const absentPercent = totalEmployees ? Math.max(0, 100 - presentPercent - leavePercent) : 0;

  const statCards = [
    { title: "Total Employees", value: totalEmployees.toString(), icon: Users, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
    { title: "Present Today", value: presentToday.toString(), icon: UserCheck, color: "bg-green-500", light: "bg-green-50", text: "text-green-600" },
    { title: "On Leave", value: onLeaveToday.toString(), icon: UserX, color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
    { title: "Late Check-ins", value: lateCheckins.toString(), icon: Clock, color: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-600" },
    { title: "Pending Requests", value: pendingRequests.toString(), icon: Bell, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" },
  ];

  const attendanceStats = [
    { label: "Present", percentage: presentPercent, color: "bg-green-500" },
    { label: "Leave", percentage: leavePercent, color: "bg-orange-500" },
    { label: "Absent", percentage: absentPercent, color: "bg-red-500" },
  ];

  return (
    <div className="p-6 md:p-10 font-sans text-gray-900 bg-gray-50 min-h-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        {/* Left Side: Greeting */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className={`${outfit.className} text-2xl md:text-[28px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
              {getGreeting()}, {userName} <span className="text-xl">✨</span>
            </h1>
            <p className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 mt-1.5">
              <Activity size={14} className="text-orange-500" />
              Workforce management is on track.
            </p>
          </div>
        </div>

        {/* Right Side: Date/Time & Profile */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-orange-400" />
            <span className="font-bold text-gray-700 text-sm">
              {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
            <span className="font-bold text-sm text-orange-500">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="m-0 font-bold text-gray-900 text-sm">{userName}</p>
              <p className="m-0 text-xs font-semibold text-gray-500 capitalize">Master Access</p>
            </div>
            <div className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {statCards.map((stat, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={stat.title}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.light} ${stat.text}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="text-orange-500" size={20} /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/admin/employees">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <Plus size={18} /> Add Employee
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/leaves">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <CheckCircle size={18} /> Approve Leave
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/payroll">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <FileText size={18} /> Generate Payroll
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/reports">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <Download size={18} /> Download Report
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-8">Attendance Overview</h2>
          <div className="space-y-6">
            {attendanceStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{stat.label}</span>
                  <span className="font-bold text-gray-900">{stat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-2.5 rounded-full ${stat.color}`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-8">Recent Activities</h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities found.</p>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {recentActivities.map((activity, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-100 text-orange-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {activity.type === 'leave' && <UserX size={16} />}
                    {activity.type === 'checkin' && <UserCheck size={16} />}
                    {activity.type === 'ar' && <Clock size={16} />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">{activity.user}</div>
                      <time className="font-medium text-xs text-orange-500">{activity.time}</time>
                    </div>
                    <div className="text-slate-500 text-sm">{activity.action}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}