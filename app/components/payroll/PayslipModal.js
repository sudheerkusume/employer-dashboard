"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function PayslipModal({ employee, month, onClose }) {
    const monthName = format(month, "MMMM yyyy");

    const printPayslip = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm print:bg-white print:p-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden print:shadow-none print:max-w-full"
                >
                    {/* Header Controls (Hidden when printing) */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 print:hidden">
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
                    <div className="p-8 print:p-4">
                        {/* Company Header */}
                        <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
                            <h1 className="text-3xl font-black tracking-tight text-gray-900">Realbeez</h1>
                            <p className="text-gray-500 font-medium text-sm mt-1">Payslip for the month of {monthName}</p>
                        </div>

                        {/* Employee Details */}
                        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                            <div className="space-y-3">
                                <div className="flex"><span className="w-32 font-bold text-gray-500">Employee Name:</span> <span className="font-bold text-gray-900">{employee.name}</span></div>
                                <div className="flex"><span className="w-32 font-bold text-gray-500">Designation:</span> <span className="font-semibold text-gray-700 capitalize">{employee.role ? employee.role.replace('_', ' ') : 'N/A'}</span></div>
                                <div className="flex"><span className="w-32 font-bold text-gray-500">Employee ID:</span> <span className="font-semibold text-gray-700">{employee.employeeCode || "N/A"}</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex"><span className="w-32 font-bold text-gray-500">Days Present:</span> <span className="font-semibold text-gray-700">{employee.daysPresent}</span></div>
                                <div className="flex"><span className="w-32 font-bold text-gray-500">Days Absent:</span> <span className="font-semibold text-gray-700">{employee.daysAbsent}</span></div>
                                <div className="flex"><span className="w-32 font-bold text-gray-500">PAN Number:</span> <span className="font-semibold text-gray-700">{employee.panNumber || "N/A"}</span></div>
                            </div>
                        </div>

                        {/* Salary Table */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                            <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-sm">
                                <div className="p-4 border-r border-gray-200">Earnings</div>
                                <div className="p-4">Deductions</div>
                            </div>
                            <div className="grid grid-cols-2 text-sm text-gray-600">
                                {/* Earnings Side */}
                                <div className="p-4 space-y-3 border-r border-gray-200">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Basic Salary</span>
                                        <span className="font-bold text-gray-900">₹{employee.monthlyBaseSalary ? employee.monthlyBaseSalary.toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</span>
                                    </div>
                                    {/* Add Allowances here if needed in future */}
                                </div>
                                
                                {/* Deductions Side */}
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Leave Deductions</span>
                                        <span className="font-bold text-red-600">₹{employee.deductions ? employee.deductions.toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Taxes (TDS)</span>
                                        <span className="font-bold text-red-600">₹0.00</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Totals */}
                            <div className="grid grid-cols-2 bg-gray-50 border-t border-gray-200 text-sm">
                                <div className="p-4 flex justify-between font-bold border-r border-gray-200">
                                    <span className="text-gray-700">Total Earnings</span>
                                    <span className="text-gray-900">₹{employee.monthlyBaseSalary ? employee.monthlyBaseSalary.toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</span>
                                </div>
                                <div className="p-4 flex justify-between font-bold">
                                    <span className="text-gray-700">Total Deductions</span>
                                    <span className="text-red-600">₹{employee.deductions ? employee.deductions.toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-sm">Net Payable Salary</h3>
                                <p className="text-emerald-600 text-xs mt-1 font-medium">Amount transferred to bank account</p>
                            </div>
                            <div className="text-3xl font-black text-emerald-600">
                                ₹{employee.netSalary ? employee.netSalary.toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
                            </div>
                        </div>
                        
                        <div className="mt-8 text-center text-xs text-gray-400 font-medium">
                            This is a computer generated document. No signature is required.
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Styles for printing */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .fixed {
                        position: absolute !important;
                    }
                    .print\\:bg-white * {
                        visibility: visible;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </AnimatePresence>
    );
}
