"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSunday } from "date-fns";

export default function PayslipModal({ employee, month, onClose }) {
    const monthName = format(month, "MMMM yyyy");
    const totalMonthDays = getDaysInMonth(month);

    // Calculate Working Days
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const allDays = eachDayOfInterval({ start, end });
    const sundaysCount = allDays.filter(isSunday).length;
    const publicHolidaysCount = employee.publicHolidays || employee.holidays || 0;
    const totalWorkingDays = totalMonthDays - sundaysCount - publicHolidaysCount;

    // Calculate details safely
    const basicFixed = employee.monthlyBaseSalary || 0;
    const basicEarned = employee.monthlyBaseSalary || 0;

    // Deductions
    const leaveDeductions = employee.deductions || 0;
    const totalDeductions = leaveDeductions;
    const netPay = (basicEarned - totalDeductions) || 0;

    // Calculate LOP Leaves dynamically
    let displayLopLeaves = employee.lopLeaves;
    if (displayLopLeaves === undefined || displayLopLeaves === 0) {
        if (leaveDeductions > 0 && basicFixed > 0) {
            const perDaySalary = basicFixed / totalMonthDays;
            displayLopLeaves = Math.round(leaveDeductions / perDaySalary);
        } else {
            const present = employee.daysPresent || 0;
            const paid = employee.paidLeaves || 0;
            const weekOffs = employee.weekOffs !== undefined ? employee.weekOffs : sundaysCount;
            const calcLop = totalMonthDays - present - paid - weekOffs - publicHolidaysCount;
            displayLopLeaves = calcLop > 0 ? calcLop : 0;
        }
    }

    const printPayslip = () => {
        window.print();
    };

    const downloadPDF = async () => {
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.setTextColor(30, 58, 138); 
            doc.setFont("helvetica", "bold");
            doc.text("BMAX PROJECTS PRIVATE LIMITED", 105, 20, { align: "center" });
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()}`, 105, 30, { align: "center" });
            doc.setLineWidth(0.5);
            doc.line(60, 32, 150, 32);

            // Details
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            
            const detailsLeft = [
                ["Employee ID:", employee.employeeCode || "-"],
                ["DOJ:", employee.dateOfJoining ? format(new Date(employee.dateOfJoining), "yyyy-MM-dd") : "-"],
                ["Present Days:", (employee.daysPresent || 0).toString()],
                ["LOP Leave:", displayLopLeaves.toString()],
                ["Department:", employee.department || "-"],
                ["IFSC Code:", employee.ifscCode || "-"],
                ["Place of Work:", "Hyderabad, TS"],
            ];
            
            const detailsRight = [
                ["Name:", employee.name || "-"],
                ["Working Days:", totalWorkingDays.toString()],
                ["Paid Leave:", (employee.paidLeaves || 0).toString()],
                ["Designation:", employee.designation || (employee.role ? employee.role.replace('_', ' ') : "-")],
                ["Bank Account No.:", employee.accountNo || "-"],
                ["Client Name:", "BMAX PROJECTS PRIVATE LIMITED"],
            ];

            let startY = 45;
            detailsLeft.forEach((item, index) => {
                doc.setFont("helvetica", "bold");
                doc.text(item[0], 14, startY + (index * 7));
                doc.setFont("helvetica", "normal");
                doc.text(item[1], 50, startY + (index * 7));
            });

            detailsRight.forEach((item, index) => {
                doc.setFont("helvetica", "bold");
                doc.text(item[0], 110, startY + (index * 7));
                doc.setFont("helvetica", "normal");
                doc.text(item[1], 150, startY + (index * 7));
            });

            // Table
            autoTable(doc, {
                startY: startY + (detailsLeft.length * 7) + 5,
                theme: 'grid',
                headStyles: { fillColor: [209, 213, 219], textColor: [0, 0, 0], fontStyle: 'bold' }, 
                head: [['Earnings', 'Fixed', 'Earnings Amount', 'Deduction', 'Amount']],
                body: [
                    ['BASIC', Math.round(basicFixed).toString(), Math.round(basicEarned).toString(), 'Leave Deductions', Math.round(leaveDeductions).toString()],
                    ['HRA', '0', '0', 'ID card Deduction', '0'],
                    ['Bonus', '0', '0', 'PPEs Deduction', '0'],
                    ['Public Holiday Wages', '0', '0', 'Other Deductions', '0'],
                    ['Earned leaves', '0', '0', 'PT', '0'],
                    ['PPEs.', '0', '0', 'TDS', '0'],
                    ['Other Allowances', '0', '0', '-', '-'],
                    ['Reimbursement of Transport', '0', '0', '-', '-'],
                    ['Attendance Bonus', '0', '0', '-', '-'],
                    ['OT', '0', '0', '-', '-'],
                    [{ content: 'Total Earnings(A)', fontStyle: 'bold' }, { content: Math.round(basicFixed).toString(), fontStyle: 'bold' }, { content: Math.round(basicEarned).toString(), fontStyle: 'bold' }, { content: 'Total Deduction(B)', fontStyle: 'bold' }, { content: Math.round(totalDeductions).toString(), fontStyle: 'bold' }],
                    [{ content: 'Net pay(A-B)', colSpan: 2, fontStyle: 'bold' }, { content: `${Math.round(netPay)}/-`, fontStyle: 'bold' }, { content: '', colSpan: 2 }],
                ],
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("**Thanks for Your Hard work**", 105, finalY, { align: "center" });
            doc.text("*This is system Generated Pay Slip and does not require signature*", 105, finalY + 5, { align: "center" });

            doc.save(`Payslip_${employee.name || "Employee"}_${monthName.replace(" ", "_")}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
            alert("Could not generate PDF. Please use the Print option and 'Save as PDF'.");
        }
    };

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
                                onClick={downloadPDF}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
                            </button>
                            <button
                                onClick={printPayslip}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                            >
                                <PrinterIcon className="w-4 h-4" /> Print
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
                                <div>{employee.dateOfJoining ? format(new Date(employee.dateOfJoining), "yyyy-MM-dd") : "-"}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Working Days:</div>
                                <div>{totalWorkingDays}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Present Days:</div>
                                <div>{employee.daysPresent || 0}</div>
                            </div>

                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">Paid Leave:</div>
                                <div className="text-emerald-600 font-bold">{employee.paidLeaves || 0}</div>
                            </div>
                            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
                                <div className="text-gray-700">LOP Leave:</div>
                                <div className="text-red-500 font-bold">{displayLopLeaves}</div>
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
