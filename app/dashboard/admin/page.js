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
import { format, parse, isAfter } from "date-fns";
import RootContext from "@/app/components/config/rootcontext";
import BirthdayCelebration from "@/app/components/common/BirthdayCelebration";

export default function DashboardHome() {
  const [isClient, setIsClient] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingARs, setPendingARs] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user_details");
    let userData = null;
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
        setCurrentUserData(userData);
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
        (emp.leaves || []).filter(lr => lr.status === "pending").map(lr => ({ ...lr, employeeName: emp.name }))
      );

      allPendingLeaves.sort((a, b) => new
        Date(b.createdAt || b.startDate) - new
          Date(a.createdAt || a.startDate)
      );
      setPendingLeaves(allPendingLeaves);

      const allPendingARs = employeesData.flatMap(emp =>
        (emp.attendanceRegularizationRequests || []).filter(ar => ar.status === "pending").map(ar => ({ ...ar, employeeName: emp.name }))
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
  let withoutIntimation = 0;
  let recentCheckins = [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const monthName = format(new Date(), "MMMM");
  const isSundayToday = new Date().getDay() === 0;

  if (employeesData) {
    employeesData.forEach(emp => {
      // Check Leaves
      const isOnLeave = (emp.leaves || []).some(leave =>
        leave.status === "approved" &&
        new Date(leave.startDate) <= new Date() &&
        new Date(leave.endDate) >= new Date()
      );

      const monthData = emp.attendance?.[monthName] || [];
      const todayRecord = monthData.find(d => d.date === todayStr);
      const isPresent = todayRecord && (todayRecord.checkIn || todayRecord.status === "present");

      if (isOnLeave) {
        onLeaveToday++;
      }
      else if (isPresent) {
        presentToday++;
        if (todayRecord.checkIn) {
          const checkInTime = parse(todayRecord.checkIn, "HH:mm", new Date());
          const lateThreshold = parse("10:30", "HH:mm", new Date());
          if (isAfter(checkInTime, lateThreshold)) {
            lateCheckins++;
          }
          recentCheckins.push({
            user: emp.name,
            action: `checked in at ${todayRecord.checkIn}`,
            time: "Today",
            type: "checkin"
          });
        }
      }
      else {
        if (!isSundayToday) {
          withoutIntimation++;
        }
      }
      // else {
      //   // Check Attendance
      //   const monthData = emp.attendance?.[monthName] || [];
      //   const todayRecord = monthData.find(d => d.date === todayStr);
      //   if (todayRecord && (todayRecord.checkIn || todayRecord.status === "present")) {
      //     presentToday++;

      //     // --- Late Check in ---- //  

      //     if (todayRecord.checkIn) {
      //       const checkInTime = parse(todayRecord.checkIn, "HH:mm", new Date());
      //       const lateThreshold = parse("10:00", "HH:mm", new Date());
      //       if (isAfter(checkInTime, lateThreshold)) {
      //         lateCheckins++;
      //       }
      //     }

      //     if (todayRecord.checkIn) {
      //       recentCheckins.push({
      //         user: emp.name,
      //         action: `checked in at ${todayRecord.checkIn}`,
      //         time: "Today",
      //         type: "checkin"
      //       });
      //     }
      //   }
      // }
    }
    );
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

  // Derive Birthdays
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth();
  const currentDate = todayDate.getDate();

  const birthdaysToday = [];
  const upcomingBirthdays = [];

  if (employeesData) {
    employeesData.forEach(emp => {
      if (!emp.dateOfBirth) return;
      const dob = new Date(emp.dateOfBirth);
      const dobMonth = dob.getMonth();
      const dobDate = dob.getDate();

      if (dobMonth === currentMonth && dobDate === currentDate) {
        birthdaysToday.push(emp);
      } else {
        // Check if within next 7 days
        // We set the DOB to the current year to easily compare differences
        const upcomingDob = new Date(todayDate.getFullYear(), dobMonth, dobDate);
        const timeDiff = upcomingDob.getTime() - todayDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Handle end of year wrap-around
        let finalDaysDiff = daysDiff;
        if (daysDiff < 0) {
          const nextYearDob = new Date(todayDate.getFullYear() + 1, dobMonth, dobDate);
          finalDaysDiff = Math.ceil((nextYearDob.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
        }

        if (finalDaysDiff > 0 && finalDaysDiff <= 7) {
          upcomingBirthdays.push({ ...emp, daysUntil: finalDaysDiff });
        }
      }
    });

    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // Calculate percentages
  const presentPercent = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const leavePercent = totalEmployees ? Math.round((onLeaveToday / totalEmployees) * 100) : 0;
  const absentPercent = totalEmployees ? Math.max(0, 100 - presentPercent - leavePercent) : 0;

  // const statCards = [
  //   { title: "Total Employees", value: totalEmployees.toString(), icon: Users, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
  //   { title: "Present Today", value: presentToday.toString(), icon: UserCheck, color: "bg-green-500", light: "bg-green-50", text: "text-green-600" },
  //   { title: "On Leave", value: onLeaveToday.toString(), icon: UserX, color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
  //   { title: "Late Check-ins", value: lateCheckins.toString(), icon: Clock, color: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-600" },
  //   { title: "Pending Requests", value: pendingRequests.toString(), icon: Bell, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" },
  // ];
  const statCards = [
    { title: "Total Employees", value: totalEmployees.toString(), link: "/dashboard/admin/employees", icon: Users, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
    { title: "Present Today", value: presentToday.toString(), subStatLabel: "Late Check-ins", subStatValue: lateCheckins.toString(), link: "/dashboard/admin/attendance", icon: UserCheck, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
    { title: "Leave Approved", value: onLeaveToday.toString(), subStatLabel: "Without Intimation", subStatValue: withoutIntimation.toString(), link: "/dashboard/admin/leaves", icon: UserX, color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
    { title: "Pending Requests", value: pendingRequests.toString(), link: "/dashboard/admin/leaves", icon: Bell, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" }
  ];

  const attendanceStats = [
    { label: "Present", percentage: presentPercent, color: "bg-green-500" },
    { label: "Leave", percentage: leavePercent, color: "bg-orange-500" },
    { label: "Absent", percentage: absentPercent, color: "bg-red-500" },
  ];

  const handleDownloadReport = () => {
    if (!employeesData || employeesData.length === 0) {
      alert("No data available to download");
      return;
    }

    const headers = ["Name", "Email", "Mobile", "Role", "Designation", "Department"];

    const csvContent = [
      headers.join(","),
      ...employeesData.map(emp =>
        [
          `"${emp.name || ''}"`,
          `"${emp.email || ''}"`,
          `"${emp.mobile || ''}"`,
          `"${emp.role || ''}"`,
          `"${emp.designation || ''}"`,
          `"${emp.department || ''}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_Report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, index) => (
          <Link href={stat.link} key={stat.title} className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full cursor-pointer"
            >
              {/* Sleek Top-Right Corner Shape */}
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.light} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-gray-500 text-sm font-semibold mb-1">{stat.title}</p>
                  <h3 className={`${outfit.className} text-3xl font-bold text-gray-900`}>{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>

              {/* Sub-stat section (Late Check-ins, etc) */}
              {
                stat.subStatLabel && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
                    <span className="text-xs font-medium text-gray-500">
                      {stat.subStatLabel}
                    </span>
                    <span className={`text-sm font-bold ${stat.text}`}>
                      {stat.subStatValue}
                    </span>
                  </div>
                )
              }
            </motion.div>
          </Link>
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
          <motion.button
            onClick={handleDownloadReport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm font-medium"
          >
            <Download size={18} /> Download Report
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

      <div className="grid grid-cols-1 gap-8">
        {/* Birthday Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden"
        >
          {/* subtle gradient background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>

          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🎉 Upcoming Birthdays
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Today</h3>
              {birthdaysToday.length === 0 ? (
                <p className="text-gray-500 text-sm">No birthdays today.</p>
              ) : (
                <div className="space-y-3">
                  {birthdaysToday.map((emp, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-pink-50 border border-pink-100 p-3 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold shadow-md">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{emp.name}</p>
                        <p className="text-xs text-pink-600 font-medium">{emp.department || "Employee"}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xl" title="Happy Birthday!">🎂</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Next 7 Days</h3>
              {upcomingBirthdays.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming birthdays this week.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBirthdays.map((emp, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{emp.name}</p>
                        <p className="text-xs text-gray-500 font-medium">Turns a year older in {emp.daysUntil} day{emp.daysUntil > 1 ? 's' : ''}</p>
                      </div>
                      <div className="ml-auto text-sm font-bold text-gray-400">
                        {format(new Date(emp.dateOfBirth), "MMM dd")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Birthday Celebration Widget */}
      <BirthdayCelebration currentUser={currentUserData} allEmployees={employeesData} />
    </div>
  );
}