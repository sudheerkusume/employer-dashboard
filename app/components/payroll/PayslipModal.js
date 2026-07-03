"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { format, getDaysInMonth } from "date-fns";

export default function PayslipModal({ employee, month, onClose }) {
    const monthName = format(month, "MMMM yyyy");
    const totalDays = getDaysInMonth(month);

    const printPayslip = () => {
        window.print();
    };

    // Calculate details safely
    const basicFixed = employee.monthlyBaseSalary || 0;
    const basicEarned = employee.monthlyBaseSalary || 0;

    // Deductions
    const leaveDeductions = employee.deductions || 0;
    const totalDeductions = leaveDeductions;
    const netPay = (basicEarned - totalDeductions) || 0;

    return (
        <AnimatePresence>
            <div key="payslip-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm print:bg-white print:p-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white shadow-xl w-full max-w-4xl overflow-y-auto max-h-[90vh] print:shadow-none print:max-w-full print:h-auto print:max-h-none print:overflow-visible"
                >
                    {/* Header Controls (Hidden when printing) */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 print:hidden sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-gray-900">Salary Slip - {monthName}</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={printPayslip}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                            >
                                <PrinterIcon className="w-4 h-4" /> Print PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Payslip Content (This part gets printed) */}
                    <div id="payslip-content" className="p-8 print:p-4 text-gray-900 text-[13px] font-sans leading-snug">
                        {/* Company Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-blue-900 uppercase">BMAX PROJECTS PRIVATE LIMITED</h1>
                            <div className="mt-4 inline-block border-b border-black px-2 sm:px-4 pb-1">
                                <h2 className="text-sm sm:text-base font-bold underline decoration-1 underline-offset-2 uppercase tracking-wide">
                                    Payslip for the month of {monthName}
                                </h2>
                            </div>
                        </div>

                        {/* Employee Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-8 px-2 font-medium">
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Employee ID:</div>
                                <div>{employee.employeeCode || "-"}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Name:</div>
                                <div>{employee.name || "-"}</div>
                            </div>

                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">DOJ:</div>
                                <div>{employee.dateOfJoining ? format(new Date(employee.dateOfJoining), "yyyy-MM-dd HH:mm:ss") : "-"}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">No. Days:</div>
                                <div>{totalDays}</div>
                            </div>

                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Designation:</div>
                                <div className="capitalize">{employee.designation || employee.role?.replace('_', ' ') || "-"}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Department:</div>
                                <div>{employee.department || "-"}</div>
                            </div>

                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Bank Account No.:</div>
                                <div>{employee.accountNo || "-"}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">IFSC Code:</div>
                                <div>{employee.ifscCode || "-"}</div>
                            </div>

                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Client Name:</div>
                                <div>BMAX PROJECTS PRIVATE LIMITED</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Place of Work:</div>
                                <div>Hyderabad, TS</div>
                            </div>
                        </div>

                        {/* Salary Table */}
                        <div className="border-2 border-gray-600 mb-6 overflow-x-auto">
                            <table className="w-full text-center border-collapse whitespace-nowrap min-w-[600px] print:min-w-0 print:whitespace-normal">
                                <thead>
                                    <tr className="bg-gray-300 text-gray-900 border-b-2 border-gray-600">
                                        <th className="py-2 px-2 border-r border-gray-600 font-bold w-1/3">Earnings</th>
                                        <th className="py-2 px-2 border-r border-gray-600 font-bold">Fixed</th>
                                        <th className="py-2 px-2 border-r border-gray-600 font-bold">Earnings Amount</th>
                                        <th className="py-2 px-2 border-r border-gray-600 font-bold w-1/3">Deduction</th>
                                        <th className="py-2 px-2 font-bold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">BASIC</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">{Math.round(basicFixed)}</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">{Math.round(basicEarned)}</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Leave Deductions</td>
                                        <td className="py-1.5 px-2">{Math.round(leaveDeductions)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">HRA</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">ID card Deduction</td>
                                        <td className="py-1.5 px-2">0</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Bonus</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">PPEs Deduction</td>
                                        <td className="py-1.5 px-2">0</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Public Holiday Wages</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Other Deductions</td>
                                        <td className="py-1.5 px-2">0</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Earned leaves</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">PT</td>
                                        <td className="py-1.5 px-2">0</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">PPEs.</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">TDS</td>
                                        <td className="py-1.5 px-2">0</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Other Allowances</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">-</td>
                                        <td className="py-1.5 px-2">-</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Reimbursement of Transport</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">-</td>
                                        <td className="py-1.5 px-2">-</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">Attendance Bonus</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">-</td>
                                        <td className="py-1.5 px-2">-</td>
                                    </tr>
                                    <tr className="border-b-2 border-gray-600">
                                        <td className="py-1.5 px-2 border-r border-gray-600 text-left pl-4 font-medium">OT</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">0</td>
                                        <td className="py-1.5 px-2 border-r border-gray-600">-</td>
                                        <td className="py-1.5 px-2">-</td>
                                    </tr>
                                    {/* Totals Row */}
                                    <tr className="font-bold border-b-2 border-gray-600 bg-gray-50">
                                        <td className="py-2 px-2 border-r border-gray-600 text-left pl-4">Total Earnings(A)</td>
                                        <td className="py-2 px-2 border-r border-gray-600">{Math.round(basicFixed)}</td>
                                        <td className="py-2 px-2 border-r border-gray-600">{Math.round(basicEarned)}</td>
                                        <td className="py-2 px-2 border-r border-gray-600 text-left pl-4">Total Deduction(B)</td>
                                        <td className="py-2 px-2">{Math.round(totalDeductions)}</td>
                                    </tr>
                                    {/* Net Pay Row */}
                                    <tr className="font-bold">
                                        <td colSpan={2} className="py-2 px-2 border-r border-gray-600 text-left pl-4">Net pay(A-B)</td>
                                        <td className="py-2 px-2 border-r border-gray-600 text-left pl-4">{Math.round(netPay)}/-</td>
                                        <td colSpan={2} className="py-2 px-2"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Notes */}
                        <div className="text-center font-bold space-y-1 mt-8 text-xs">
                            <p>**Thanks for Your Hard work**</p>
                            <p>*This is system Generated Pay Slip and does not require signature*</p>
                        </div>
                    </div>
                </motion.div>
            </div >

            {/* Styles for printing */}
            < style jsx global > {`
                @media print {
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #payslip-content, #payslip-content * {
                        visibility: visible !important;
                    }
                    #payslip-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                    }
                }
            `}</style >
        </AnimatePresence >
    );
}
