"use client";
import React, { useEffect, useState } from "react";
import PayslipCard from "../payslipcard";
import { generatePayslip } from "../config/payslipgenerate";

export default function Payslips({ profile }) {
    const [payslips, setPayslips] = useState([]);

    useEffect(() => {
        const now = new Date();
        if (now.getDate() >= 5) {
            const newPayslip = generatePayslip(profile);
            setPayslips((prev) => {
                const exists = prev.some(
                    (p) => p.month === newPayslip.month && p.year === newPayslip.year
                );
                return exists ? prev : [...prev, newPayslip];
            });
        }
    }, [profile]);

    return (
        <div className="max-w-3xl text-gray-800 mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Payslips</h2>
            {payslips.length === 0 ? (
                <p>No payslips available yet.</p>
            ) : (
                payslips.map((p, i) => <PayslipCard key={i} payslip={p} />)
            )}
        </div>
    );
}
