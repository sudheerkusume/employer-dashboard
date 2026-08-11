"use client";
import React, { useState, useMemo } from "react";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, parse, differenceInMinutes, isAfter, isBefore, isSunday } from "date-fns";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import { motion } from "framer-motion";
import { BanknotesIcon, UsersIcon, CheckCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { Outfit } from "next/font/google";
import PayslipModal from "@/app/components/payroll/PayslipModal";

const outfit = Outfit({ subsets: ["latin"] });

export default function AdminPayrollPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        let lopLeaveDays = 0;

        monthDates.forEach(date => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isWorkingDay = !isSunday(date) && !holidays.includes(dateStr);
          
          const isOnLeave = approvedLeaves.some(l => {
            const start = parse(l.startDate, "yyyy-MM-dd", new Date());
            const end = parse(l.endDate, "yyyy-MM-dd", new Date());
            return start <= date && end >= date;
          });

          const isLopLeave = approvedLeaves.some(l => {
            const start = parse(l.startDate, "yyyy-MM-dd", new Date());
            const end = parse(l.endDate, "yyyy-MM-dd", new Date());
            return start <= date && end >= date && l.isLop === true;
          });

          if (isWorkingDay) {
            if (isOnLeave && !isLopLeave) leaveDaysInMonth++;
            if (isOnLeave && isLopLeave) lopLeaveDays++;
          }

          const record = monthData.find(d => d.date === dateStr);
          if (record) {
            if (record.isManualOverride || record.status === "absent" || record.status === "halfDay" || record.status === "paidLeave" || record.status === "lopLeave") {
              if (record.status === "present") totalPresent += 1;
              else if (record.status === "halfDay" || record.status === "firstHalfApproved" || record.status === "secondHalfApproved") {
                totalPresent += 0.5;
                halfDays += 1;
              }
              else if (record.status === "paidLeave" && !isOnLeave) {
                leaveDaysInMonth++; // Add manually given paid leave
              }
              else if (record.status === "lopLeave" && !isOnLeave) {
                lopLeaveDays++; // Add manually given LOP leave
              }
              if (record.checkIn) {
                 const lateThreshold = parse("10:00", "HH:mm", new Date());
                 const checkIn = parse(record.checkIn, "HH:mm", new Date());
                 if (isAfter(checkIn, lateThreshold)) lateDays++;
              }
            } else if (record.checkIn || record.status === "present") {
              let morningPresent = false;
              let afternoonPresent = false;

              if (record.checkIn) {
                 const checkInTime = parse(record.checkIn, "HH:mm", new Date());
                 const noonThreshold = parse("13:30", "HH:mm", new Date()); // 1:30 PM
                 const lateThreshold = parse("10:00", "HH:mm", new Date());

                 if (isBefore(checkInTime, noonThreshold)) {
                    morningPresent = true;
                 } else {
                    afternoonPresent = true;
                 }
                 
                 if (isAfter(checkInTime, lateThreshold)) lateDays++;
              } else if (record.status === "present") {
                 morningPresent = true; // Fallback
              }

              if (record.checkOut) {
                 const checkOutTime = parse(record.checkOut, "HH:mm", new Date());
                 const eveningThreshold = parse("18:00", "HH:mm", new Date()); // 6:00 PM
                 
                 if (morningPresent) {
                    if (isAfter(checkOutTime, eveningThreshold)) {
                       afternoonPresent = true; // Stayed till evening -> Full Day
                    }
                 } else if (afternoonPresent) {
                    if (isAfter(checkOutTime, eveningThreshold)) {
                       afternoonPresent = true; // Validated afternoon checkout
                    } else {
                       afternoonPresent = true; // Basic assumption if checked out before 6 but logged in afternoon
                    }
                 }
              } else {
                 // Forgot to checkout
                 if (morningPresent) {
                    afternoonPresent = false; // Morning half day
                 }
                 if (afternoonPresent && !morningPresent) {
                    afternoonPresent = false; // Absent
                 }
              }

              // Calculate final present value
              if (morningPresent && afternoonPresent) {
                 totalPresent += 1;
              } else if (morningPresent || afternoonPresent) {
                 totalPresent += 0.5;
                 halfDays += 1;
              }
            }
          }
        });

        const totalAbsent = Math.max(0, totalWorkingDays - Math.floor(totalPresent) - leaveDaysInMonth);

        return { totalWorkingDays, totalPresent, totalAbsent, lateDays, leaveDaysInMonth, lopLeaveDays, halfDays };
    };

    const payrollData = useMemo(() => {
        if (!employeesData) return { employees: [], summary: { totalPayroll: 0, processedEmployees: 0, totalEmployees: 0 } };

        const monthName = selectedMonth.toLocaleString("default", { month: "long" });
        const daysInMonth = getDaysInMonth(selectedMonth);
        let totalPayroll = 0;
        let processedEmployees = 0;

        const employees = employeesData.map(emp => {
            const ctc = parseFloat(emp.ctc || 0);
            const monthlyBaseSalary = ctc / 12;

            const stats = calculateAttendance(emp, selectedMonth);
            const daysPresent = stats.totalPresent;
            const daysAbsent = stats.totalAbsent;
            const paidLeaves = stats.leaveDaysInMonth;
            const lopLeaves = stats.lopLeaveDays;

            const perDaySalary = monthlyBaseSalary / daysInMonth;
            const deductions = daysAbsent * perDaySalary;
            const netSalary = monthlyBaseSalary - deductions;

            if (netSalary > 0) {
                totalPayroll += netSalary;
                processedEmployees++;
            }

            return {
                ...emp,
                monthlyBaseSalary,
                daysPresent,
                daysAbsent,
                paidLeaves,
                lopLeaves,
                deductions,
                netSalary
            };
        });

        return {
            employees,
            summary: {
                totalPayroll,
                processedEmployees,
                totalEmployees: employees.length
            }
        };
    }, [employeesData, selectedMonth, holidaysData]);

    if (employeesError) return <Error />;
    if (employeesLoading) return <Loading />;

    const handleViewPayslip = (emp) => {
        setSelectedEmployee(emp);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10 font-sans text-gray-900">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className={`${outfit.className} text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
                        Payroll <span className="text-orange-500">Dashboard</span>
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium text-sm">Manage salaries, attendance deductions, and payslips.</p>
                </div>
                
                {/* Month Selector */}
                <div className="flex bg-white p-2 rounded-xl shadow-sm border border-gray-200 items-center">
                    <span className="text-sm font-semibold text-gray-500 mr-2 ml-2">Month:</span>
                    <input 
                        type="month" 
                        value={format(selectedMonth, "yyyy-MM")}
                        onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                        className="border-none focus:ring-0 text-sm font-bold text-gray-800 bg-transparent cursor-pointer"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                        <BanknotesIcon className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Payroll</p>
                        <h3 className="text-2xl font-black text-gray-900">₹{payrollData.summary.totalPayroll.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    </div>
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <UsersIcon className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Processed Staff</p>
                        <h3 className="text-2xl font-black text-gray-900">{payrollData.summary.processedEmployees} <span className="text-sm font-medium text-gray-400">/ {payrollData.summary.totalEmployees}</span></h3>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircleIcon className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Status</p>
                        <h3 className="text-2xl font-black text-emerald-600">Pending Review</h3>
                    </div>
                </motion.div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Base Salary</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Attendance</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right text-red-500">Deductions</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right text-emerald-600">Net Pay</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payrollData.employees.map(emp => (
                                <motion.tr 
                                    key={emp._id}
                                    whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                                    className="transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden">
                                                {emp.profileImage ? <img src={emp.profileImage} className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{emp.name}</div>
                                                <div className="text-xs text-gray-500 font-medium capitalize">{emp.role.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-700">
                                        ₹{emp.monthlyBaseSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 border border-gray-200">
                                            <span className="text-emerald-600">{emp.daysPresent}P</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-red-500">{emp.daysAbsent}A</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-red-500">
                                        - ₹{emp.deductions.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">
                                        ₹{emp.netSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleViewPayslip(emp)}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-sm"
                                        >
                                            <DocumentTextIcon className="w-4 h-4" /> Payslip
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                            {payrollData.employees.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-medium">
                                        No employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payslip Modal */}
            {isModalOpen && selectedEmployee && (
                <PayslipModal 
                    employee={selectedEmployee} 
                    month={selectedMonth} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
}
