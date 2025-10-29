"use client";
import React from "react";
import { generatePDF } from "./payslippdf";

export default function PayslipCard({ payslip }) {
    return (
        <div className="bg-white text-gray-900 shadow rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">{payslip.month} {payslip.year}</h3>
                <p className="text-sm text-gray-500">
                    Net Pay: ₹{payslip.netPay.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-500">
                    Present Days: {payslip.totalPresentDays}
                </p>
            </div>
            <button
                onClick={() => generatePDF(payslip)}
                className="px-4 py-1 bg-[#D79A2F] text-white rounded hover:bg-yellow-500"
            >
                Download PDF
            </button>
        </div>
    );
}
