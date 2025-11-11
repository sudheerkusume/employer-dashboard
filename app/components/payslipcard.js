"use client";
import React, { useState } from "react";
import { generatePDF } from "./payslippdf";

export default function PayslipCard({ payslip, profile }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0 = Jan
    const currentYear = today.getFullYear();

    // Parse payslip date
    const payslipDate = new Date(`${payslip.month} 1, ${payslip.year}`);
    const payslipMonth = payslipDate.getMonth();
    const payslipYear = payslipDate.getFullYear();

    // Get date of joining
    const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;

    // Check if payslip is for a month after date of joining
    const isAfterJoining = dateOfJoining ?
        (payslipYear > dateOfJoining.getFullYear()) ||
        (payslipYear === dateOfJoining.getFullYear() && payslipMonth >= dateOfJoining.getMonth())
        : true;

    // Determine if payslip is for last month
    const isPreviousMonth =
        (currentMonth === payslipMonth + 1 && currentYear === payslipYear) ||
        (currentMonth === 0 && payslipMonth === 11 && currentYear === payslipYear + 1);

    // ✅ Show payslip if:
    // 1. It's after date of joining
    // 2. AND (It's NOT the immediate previous month OR it IS the immediate previous month AND today >= 5)
    const shouldShow = isAfterJoining && (!isPreviousMonth || (isPreviousMonth && currentDay >= 5));

    if (!shouldShow) return null; // hide this payslip

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await generatePDF(payslip);
        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setTimeout(() => setIsDownloading(false), 1000);
        }
    };

    return (
        <div className="bg-white text-gray-900 shadow rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">
                    {payslip.month} {payslip.year}
                </h3>
                <p className="text-sm text-gray-500">
                    Net Pay: ₹{payslip.netPay.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-500">
                    Present Days: {payslip.totalPresentDays}
                </p>
            </div>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`px-4 py-1 rounded text-white transition ${isDownloading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#D79A2F] hover:bg-yellow-500"
                    }`}
            >
                {isDownloading ? "Downloading..." : "Download PDF"}
            </button>
        </div>
    );
}