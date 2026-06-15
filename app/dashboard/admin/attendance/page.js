"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import {
  parse,
  differenceInMinutes,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSunday,
  format,
  isAfter,
} from "date-fns";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, UserCheck, Users, Clock, AlertCircle, CalendarDays, LayoutGrid, List, Edit3, X, Eye } from "lucide-react";
import RootContext from "@/app/components/config/rootcontext";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export default function AdminAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState("today"); // "today" or "monthly"
  const [filterMode, setFilterMode] = useState("all"); // "all", "present", "late", "absent"
  
  // Edit State
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "", status: "absent" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  const { rootContext } = useContext(RootContext);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");
    let userData = null;
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (e) {
        console.error("Invalid JSON", e);
      }
    }
    const role = userData?.role?.toLowerCase?.() || "";
    setCurrentUserRole(role);
  }, [router]);

  const {
    data: employeesData,
    error: employeesError,
    isLoading: employeesLoading,
  } = useSWRFetch("/api/employees");

  const {
    data: holidaysData,
  } = useSWRFetch("/api/holidays");

  const calculateAttendance = (emp, monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const holidays = holidaysData ? holidaysData.map(h => format(new Date(h.date), "yyyy-MM-dd")) : ["2025-01-01", "2025-01-26", "2025-03-25", "2025-08-15", "2025-10-02", "2025-10-18", "2025-10-20", "2025-12-25"];
    
    const totalWorkingDays = monthDates.filter(
      (d) => !isSunday(d) && !holidays.includes(format(d, "yyyy-MM-dd"))
    ).length;

    const monthName = monthDate.toLocaleString("default", { month: "long" });
    const monthData = emp.attendance?.[monthName] || [];
    
    let totalPresent = 0;
    let lateDays = 0;
    let halfDays = 0;
    
    const empLeaves = emp.leaves || [];
    const approvedLeaves = empLeaves.filter(l => l.status === "approved");

    let leaveDaysInMonth = 0;

    monthDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const isWorkingDay = !isSunday(date) && !holidays.includes(dateStr);
      
      const isOnLeave = approvedLeaves.some(l => {
        const start = parse(l.startDate, "yyyy-MM-dd", new Date());
        const end = parse(l.endDate, "yyyy-MM-dd", new Date());
        return start <= date && end >= date;
      });

      if (isOnLeave && isWorkingDay) leaveDaysInMonth++;

      const record = monthData.find(d => d.date === dateStr);
      if (record) {
        if (record.isManualOverride || record.status === "absent" || record.status === "halfDay") {
          // If manually overridden by admin, or explicitly absent/halfDay, respect it over hours calculation
          if (record.status === "present") totalPresent += 1;
          else if (record.status === "halfDay" || record.status === "firstHalfApproved" || record.status === "secondHalfApproved") {
            totalPresent += 0.5;
            halfDays += 1;
          }
          
          if (record.checkIn) {
             const lateThreshold = parse("10:00", "HH:mm", new Date());
             const checkIn = parse(record.checkIn, "HH:mm", new Date());
             if (isAfter(checkIn, lateThreshold)) lateDays++;
          }
        } else if (record.checkIn && record.checkOut) {
          const checkIn = parse(record.checkIn, "HH:mm", new Date());
          const checkOut = parse(record.checkOut, "HH:mm", new Date());
          let workedHours = differenceInMinutes(checkOut, checkIn) / 60;
          
          // Fix negative hours if check-out time is passed midnight (e.g. 6:30 AM next day or wrong 12-hr format)
          if (workedHours < 0) workedHours += 24;
          
          if (workedHours >= 8.75) totalPresent += 1;
          else if (workedHours >= 4.25) {
             totalPresent += 0.5;
             halfDays += 1;
          }
          
          const lateThreshold = parse("10:00", "HH:mm", new Date());
          if (isAfter(checkIn, lateThreshold)) lateDays++;

        } else if (record.status === "present") {
          // Fallback if checked-in but not checked out yet (ongoing shift)
          totalPresent += 1;
          if (record.checkIn) {
             const lateThreshold = parse("10:00", "HH:mm", new Date());
             const checkIn = parse(record.checkIn, "HH:mm", new Date());
             if (isAfter(checkIn, lateThreshold)) lateDays++;
          }
        }
      }
    });

    const totalAbsent = Math.max(0, totalWorkingDays - Math.floor(totalPresent) - leaveDaysInMonth);

    return { totalWorkingDays, totalPresent, totalAbsent, lateDays, leaveDaysInMonth, halfDays };
  };

  const visibleEmployees = useMemo(() => {
    if (!employeesData) return [];
    return currentUserRole === "super_admin"
      ? employeesData
      : employeesData.filter((emp) => emp.role !== "admin");
  }, [employeesData, currentUserRole]);

  // Today's Metrics
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  const todayStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let onLeave = 0;

    visibleEmployees.forEach(emp => {
      const monthData = emp.attendance?.[currentMonthName] || [];
      const todayRecord = monthData.find(d => d.date === todayStr);
      
      const empLeaves = emp.leaves || [];
      const isOnLeave = empLeaves.some(
        (leave) =>
          leave.status === "approved" &&
          new Date(leave.startDate) <= new Date() &&
          new Date(leave.endDate) >= new Date()
      );

      if (isOnLeave) {
        onLeave++;
      } else if (todayRecord?.checkIn) {
        present++;
        // Check if late (e.g. after 10:00 AM)
        const checkInTime = parse(todayRecord.checkIn, "HH:mm", new Date());
        const lateThreshold = parse("10:00", "HH:mm", new Date());
        if (isAfter(checkInTime, lateThreshold)) {
          late++;
        }
      } else {
        absent++;
      }
    });

    return { total: visibleEmployees.length, present, late, absent, onLeave };
  }, [visibleEmployees, currentMonthName, todayStr]);

  if (employeesError) return <Error />;
  if (employeesLoading) return <Loading />;

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return "E";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleUpdateAttendance = async () => {
    if (!editingAttendance) return;
    setIsUpdating(true);
    try {
      const { empId, date, monthName, attendanceData } = editingAttendance;
      
      const newAttendance = JSON.parse(JSON.stringify(attendanceData || {}));
      if (!newAttendance[monthName]) {
        newAttendance[monthName] = [];
      }
      
      const recordIndex = newAttendance[monthName].findIndex(d => d.date === date);
      
      if (recordIndex >= 0) {
        newAttendance[monthName][recordIndex] = {
          ...newAttendance[monthName][recordIndex],
          checkIn: editForm.checkIn,
          checkOut: editForm.checkOut,
          status: editForm.status
        };
      } else {
        newAttendance[monthName].push({
          date: date,
          checkIn: editForm.checkIn,
          checkOut: editForm.checkOut,
          status: editForm.status
        });
      }
      
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: empId, attendance: newAttendance })
      });
      
      if (!res.ok) throw new Error("Failed to update attendance");
      
      setEditingAttendance(null);
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10 font-sans text-gray-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className={`${outfit.className} text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
            Attendance <span className="text-orange-500">Command Center</span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Real-time attendance overview and monthly analytics.</p>
        </div>
        
        {/* Toggle View */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setViewMode("today")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "today" ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LayoutGrid size={16} /> Live Today
          </button>
          <button 
            onClick={() => setViewMode("monthly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "monthly" ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List size={16} /> Monthly Logs
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { id: "all", title: "Total Employees", value: todayStats.total, icon: Users, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
          { id: "present", title: "Present Today", value: todayStats.present, icon: UserCheck, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
          { id: "late", title: "Late Arrivals", value: todayStats.late, icon: Clock, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" },
          { id: "absent", title: "Absent / Leave", value: todayStats.absent + todayStats.onLeave, icon: AlertCircle, color: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => {
              setViewMode("today");
              setFilterMode(stat.id);
            }}
            className={`cursor-pointer rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border relative overflow-hidden group transition-all duration-200 ${filterMode === stat.id && viewMode === "today" ? 'bg-white border-gray-400 ring-2 ring-orange-500/20' : 'bg-white border-gray-100 hover:border-gray-300'}`}
          >
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
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "today" ? (
          <motion.div 
            key="today"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Employee</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Check-In</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Check-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <UserCheck size={40} className="text-gray-300 mb-3" />
                          <p className="text-base font-bold text-gray-900">No employees found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleEmployees.map(emp => {
                      const monthData = emp.attendance?.[currentMonthName] || [];
                      const todayRecord = monthData.find(d => d.date === todayStr);
                      
                      const empLeaves = emp.leaves || [];
                      const isOnLeave = empLeaves.some(
                        (leave) =>
                          leave.status === "approved" &&
                          new Date(leave.startDate) <= new Date() &&
                          new Date(leave.endDate) >= new Date()
                      );

                      let statusText = "Absent";
                      let statusStyle = "bg-rose-50 text-rose-700 border-rose-200";
                      let filterKey = "absent";
                      
                      if (isOnLeave) {
                        statusText = "On Leave";
                        statusStyle = "bg-purple-50 text-purple-700 border-purple-200";
                        filterKey = "absent";
                      } else if (todayRecord?.checkIn) {
                        const checkInTime = parse(todayRecord.checkIn, "HH:mm", new Date());
                        const lateThreshold = parse("10:00", "HH:mm", new Date());
                        if (isAfter(checkInTime, lateThreshold)) {
                          statusText = "Late";
                          statusStyle = "bg-amber-50 text-amber-700 border-amber-200";
                          filterKey = "late";
                        } else {
                          statusText = "Present";
                          statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          filterKey = "present";
                        }
                      }

                      // Apply filtering
                      if (filterMode === "present" && filterKey !== "present" && filterKey !== "late") return null;
                      if (filterMode === "late" && filterKey !== "late") return null;
                      if (filterMode === "absent" && filterKey !== "absent") return null;

                      return (
                        <motion.tr 
                          key={emp._id}
                          whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                          className="transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm border border-gray-300">
                                {getInitials(emp.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{emp.name}</h4>
                                <p className="text-[11px] text-gray-500 font-medium capitalize">{emp.role.replace('_', ' ')} • {emp.department || "N/A"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-800">{todayRecord?.checkIn || "--:--"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-800">{todayRecord?.checkOut || "--:--"}</span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="monthly"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Toolbar */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                  <CalendarDays size={18} className="text-orange-500" />
                  <input
                    type="month"
                    value={`${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`}
                    onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                    className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Employee</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Designation</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Work Days</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Present</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Absent</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Late</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Leaves</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <UserCheck size={40} className="text-gray-300 mb-3" />
                          <p className="text-base font-bold text-gray-900">No attendance data</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleEmployees.map((emp) => {
                      const monthName = selectedMonth.toLocaleString("default", { month: "long" });
                      const monthData = emp.attendance?.[monthName] || [];
                      const todayRecord = monthData.find((d) => d.date === todayStr);
                      const { totalWorkingDays, totalPresent, totalAbsent, lateDays, leaveDaysInMonth } = calculateAttendance(emp, selectedMonth);

                      let roleColor = "bg-blue-50 text-blue-700 border-blue-200";
                      if (emp.role === "manager") roleColor = "bg-amber-50 text-amber-700 border-amber-200";
                      if (emp.role === "admin") roleColor = "bg-purple-50 text-purple-700 border-purple-200";
                      if (emp.role === "super_admin") roleColor = "bg-indigo-50 text-indigo-700 border-indigo-200";

                      return (
                        <motion.tr 
                          key={emp._id} 
                          whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                          className="transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                                {getInitials(emp.name)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{emp.name}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${roleColor} capitalize`}>
                              {emp.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-600 font-semibold">{emp.designation || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-gray-600 font-bold">{totalWorkingDays}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{totalPresent}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">{totalAbsent}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{lateDays}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{leaveDaysInMonth}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setViewingReport({ emp, monthDate: selectedMonth, stats: { totalWorkingDays, totalPresent, totalAbsent, lateDays, leaveDaysInMonth } })}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                title="View Detailed Report"
                              >
                                <Eye size={16} /> Report
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Attendance Modal */}
      {editingAttendance && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className={`${outfit.className} text-xl font-bold text-gray-900`}>Manual Adjust</h3>
              <button 
                onClick={() => setEditingAttendance(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium">Employee</p>
                <p className="text-base font-bold text-gray-900">{editingAttendance.name}</p>
                <p className="text-xs text-gray-400 mt-1">Date: {editingAttendance.date}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                >
                  <option value="absent">Absent</option>
                  <option value="present">Present</option>
                  <option value="halfDay">Half Day</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Check In Time</label>
                  <input 
                    type="time" 
                    value={editForm.checkIn}
                    onChange={e => setEditForm({...editForm, checkIn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Check Out Time</label>
                  <input 
                    type="time" 
                    value={editForm.checkOut}
                    onChange={e => setEditForm({...editForm, checkOut: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setEditingAttendance(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateAttendance}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm shadow-orange-200 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Monthly Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className={`${outfit.className} text-xl font-bold text-gray-900`}>Monthly Report</h3>
                <p className="text-sm text-gray-500">{viewingReport.emp.name} • {viewingReport.monthDate.toLocaleString("default", { month: "long", year: "numeric" })}</p>
              </div>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-5 gap-4 mb-6">
                 {/* 5 stat cards */}
                 <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                    <p className="text-xs text-blue-600 font-bold mb-1">Work Days</p>
                    <p className="text-xl font-black text-blue-800">{viewingReport.stats.totalWorkingDays}</p>
                 </div>
                 <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xs text-emerald-600 font-bold mb-1">Present</p>
                    <p className="text-xl font-black text-emerald-800">{viewingReport.stats.totalPresent}</p>
                 </div>
                 <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                    <p className="text-xs text-rose-600 font-bold mb-1">Absent</p>
                    <p className="text-xl font-black text-rose-800">{viewingReport.stats.totalAbsent}</p>
                 </div>
                 <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                    <p className="text-xs text-amber-600 font-bold mb-1">Late</p>
                    <p className="text-xl font-black text-amber-800">{viewingReport.stats.lateDays}</p>
                 </div>
                 <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                    <p className="text-xs text-purple-600 font-bold mb-1">Leaves</p>
                    <p className="text-xl font-black text-purple-800">{viewingReport.stats.leaveDaysInMonth}</p>
                 </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold tracking-wider">Date</th>
                      <th className="px-4 py-3 font-bold tracking-wider">Status</th>
                      <th className="px-4 py-3 font-bold tracking-wider text-center">Check In</th>
                      <th className="px-4 py-3 font-bold tracking-wider text-center">Check Out</th>
                      <th className="px-4 py-3 font-bold tracking-wider text-center">Hours</th>
                      <th className="px-4 py-3 font-bold tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {eachDayOfInterval({ 
                      start: startOfMonth(viewingReport.monthDate), 
                      end: endOfMonth(viewingReport.monthDate) 
                    }).map((date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const holidays = holidaysData ? holidaysData.map(h => format(new Date(h.date), "yyyy-MM-dd")) : ["2025-01-01", "2025-01-26", "2025-03-25", "2025-08-15", "2025-10-02", "2025-10-18", "2025-10-20", "2025-12-25"];
                      const isWeekend = isSunday(date);
                      const isHoliday = holidays.includes(dateStr);
                      const monthName = viewingReport.monthDate.toLocaleString("default", { month: "long" });
                      const record = (viewingReport.emp.attendance?.[monthName] || []).find(d => d.date === dateStr);
                      
                      const empLeaves = viewingReport.emp.leaves || [];
                      const isOnLeave = empLeaves.some(l => 
                        l.status === "approved" && 
                        parse(l.startDate, "yyyy-MM-dd", new Date()) <= date && 
                        parse(l.endDate, "yyyy-MM-dd", new Date()) >= date
                      );

                      let status = "Absent";
                      let style = "bg-rose-50 text-rose-700";
                      let hours = "--";

                      if (isWeekend) { status = "Weekend"; style = "bg-gray-100 text-gray-600"; }
                      else if (isHoliday) { status = "Holiday"; style = "bg-indigo-50 text-indigo-700"; }
                      else if (isOnLeave) { status = "Leave"; style = "bg-purple-50 text-purple-700"; }
                      else if (record?.checkIn) {
                        const checkIn = parse(record.checkIn, "HH:mm", new Date());
                        const lateThreshold = parse("10:00", "HH:mm", new Date());
                        
                        if (record.isManualOverride || record.status === "absent" || record.status === "halfDay") {
                           status = record.status === "present" ? "Present" : (record.status === "halfDay" ? "Half Day" : "Absent");
                           style = status === "Present" ? "bg-emerald-50 text-emerald-700" : (status === "Half Day" ? "bg-orange-50 text-orange-700" : "bg-rose-50 text-rose-700");
                        } else if (isAfter(checkIn, lateThreshold)) {
                           status = "Late"; style = "bg-amber-50 text-amber-700";
                        } else {
                           status = "Present"; style = "bg-emerald-50 text-emerald-700";
                        }
                        
                        if (record.checkOut) {
                           const checkOut = parse(record.checkOut, "HH:mm", new Date());
                           let workedHours = differenceInMinutes(checkOut, checkIn) / 60;
                           if (workedHours < 0) workedHours += 24;
                           hours = workedHours.toFixed(1) + "h";
                        }
                      } else if (date > new Date()) {
                        status = "Upcoming"; style = "text-gray-400 bg-transparent";
                      }

                      return (
                        <tr key={dateStr} className={`hover:bg-gray-50 ${isWeekend ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-3 font-medium border-b border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-gray-900">{format(date, "dd MMM, yyyy")}</span>
                              <span className="text-[11px] text-gray-500 uppercase">{format(date, "EEE")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${style}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-100">{record?.checkIn || "--:--"}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-100">{record?.checkOut || "--:--"}</td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-gray-500 border-b border-gray-100">{hours}</td>
                          <td className="px-4 py-3 text-center border-b border-gray-100">
                            {date <= new Date() && !isHoliday && !isWeekend && (
                                <button 
                                  onClick={() => {
                                    setEditingAttendance({
                                      empId: viewingReport.emp._id,
                                      name: viewingReport.emp.name,
                                      date: dateStr,
                                      monthName: viewingReport.monthDate.toLocaleString("default", { month: "long" }),
                                      attendanceData: viewingReport.emp.attendance || {}
                                    });
                                    setEditForm({
                                      checkIn: record?.checkIn || "",
                                      checkOut: record?.checkOut || "",
                                      status: record?.status || (record?.checkIn ? "present" : "absent")
                                    });
                                  }}
                                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-colors"
                                  title="Edit Attendance"
                                >
                                  <Edit3 size={16} />
                                </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
