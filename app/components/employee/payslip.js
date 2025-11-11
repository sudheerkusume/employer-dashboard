"use client";
import React, { useEffect, useState } from "react";
import PayslipCard from "../payslipcard";
import { generatePayslip } from "../config/payslipgenerate";

export default function Payslips({ profile }) {
    const [payslips, setPayslips] = useState([]);

    useEffect(() => {
        if (!profile) return;

        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get date of joining
        const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;

        if (!dateOfJoining) return;

        const dojMonth = dateOfJoining.getMonth();
        const dojYear = dateOfJoining.getFullYear();

        // Generate payslips for all months from date of joining to appropriate month
        const generatedPayslips = [];

        let month = dojMonth;
        let year = dojYear;

        // Determine the latest month for which payslip should be available
        let latestAvailableMonth = currentMonth - 1; // Default: previous month
        let latestAvailableYear = currentYear;

        if (currentDay < 5) {
            // If before 5th, latest available is 2 months ago
            latestAvailableMonth = currentMonth - 2;
            if (latestAvailableMonth < 0) {
                latestAvailableMonth = 11;
                latestAvailableYear = currentYear - 1;
            }
        }

        // Generate payslips until we reach the latest available month
        while (year < latestAvailableYear || (year === latestAvailableYear && month <= latestAvailableMonth)) {
            const payslip = generatePayslip(profile, month, year);
            if (payslip) {
                // Check if this payslip already exists to avoid duplicates
                const exists = generatedPayslips.some(
                    p => p.month === payslip.month && p.year === payslip.year
                );
                if (!exists) {
                    generatedPayslips.push(payslip);
                }
            }

            // Move to next month
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }

        // Sort payslips by date (newest first)
        generatedPayslips.sort((a, b) => {
            const dateA = new Date(`${a.month} 1, ${a.year}`);
            const dateB = new Date(`${b.month} 1, ${b.year}`);
            return dateB - dateA;
        });

        setPayslips(generatedPayslips);
    }, [profile]);

    return (
        <div className="max-w-3xl text-gray-800 mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Payslips</h2>
            {payslips.length === 0 ? (
                <p>No payslips available yet.</p>
            ) : (
                payslips.map((p, i) => <PayslipCard key={`${p.month}-${p.year}-${i}`} payslip={p} profile={profile} />)
            )}
        </div>
    );
}