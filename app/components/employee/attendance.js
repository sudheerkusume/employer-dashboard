"use client";
import React, { useState, useEffect } from "react";
import moment from "moment";
import CalendarTab from "./calendar";

export default function Attendance({ profile }) {
    const user_details =
        typeof window !== "undefined" &&
        JSON.parse(localStorage.getItem("user_details"));
    const employeeId = user_details?.userId;

    const [todayAttendance, setTodayAttendance] = useState({
        checkIn: "",
        checkOut: "",
        date: new Date(),
        checkInTime: null,
    });
    const [canCheckOut, setCanCheckOut] = useState(false);

    const todayStr = new Date().toISOString().split("T")[0];

    // ✅ Fetch today's attendance from profile on mount
    useEffect(() => {
        if (!profile || !profile.attendance) return;

        const monthName = new Date(todayStr).toLocaleString("default", {
            month: "long",
        });
        const monthAttendance = profile.attendance[monthName] || [];
        const todayAtt = monthAttendance.find((a) => a.date === todayStr);

        if (todayAtt) {
            setTodayAttendance({
                checkIn: todayAtt.checkIn,
                checkOut: todayAtt.checkOut,
                date: new Date(todayStr),
                checkInTime: todayAtt.checkIn
                    ? moment(todayAtt.date + "T" + todayAtt.checkIn)
                    : null,
            });

            // If already checked in and enough time passed
            if (todayAtt.checkIn && !todayAtt.checkOut) {
                const diffHours = moment().diff(
                    moment(todayAtt.date + "T" + todayAtt.checkIn),
                    "hours",
                    true
                );
                setCanCheckOut(diffHours >= 4.5);
            }
        }
    }, [profile]);

    // ✅ Auto-enable checkout after 4.5 hours
    useEffect(() => {
        let interval;
        if (todayAttendance.checkInTime && !todayAttendance.checkOut) {
            interval = setInterval(() => {
                const now = moment();
                const checkIn = moment(todayAttendance.checkInTime);
                const worked = now.diff(checkIn, "hours", true);
                setCanCheckOut(worked >= 4.5);
            }, 60000); // check every 1 min
        }
        return () => clearInterval(interval);
    }, [todayAttendance.checkInTime, todayAttendance.checkOut]);

    // ✅ Check-In Handler
    const handleCheckIn = async () => {
        try {
            const now = new Date();
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId,
                    action: "checkin",
                    time: now.toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5),
                    date: todayStr,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setTodayAttendance({
                    checkIn: data.attendance.checkIn,
                    checkOut: "",
                    date: new Date(todayStr),
                    checkInTime: moment(),
                });
                setCanCheckOut(false);
            } else {
                alert(data?.message || data?.error || "Check-in failed");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to check in");
        }
    };

    // ✅ Check-Out Handler
    const handleCheckOut = async () => {
        if (!todayAttendance.checkIn)
            return alert("Please check in first!");

        try {
            const now = new Date();
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId,
                    action: "checkout",
                    time: now.toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5),
                    date: todayStr,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                alert(
                    `Checked out successfully.\nWorking Hours: ${data.attendance.workingHours} hrs\nStatus: ${data.attendance.status}`
                );
                setTodayAttendance({
                    checkIn: "",
                    checkOut: data.attendance.checkOut,
                    date: new Date(todayStr),
                    checkInTime: null,
                });
                setCanCheckOut(false);
            } else {
                alert(data?.message || data?.error || "Check-out failed");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to check out");
        }
    };

    // ✅ UI
    return (
        <div className="min-h-screen bg-gray-100 p-6 space-y-6">
            {/* Check-In/Out Section */}
            <div className="bg-white p-6 rounded-xl shadow-xl">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* ✅ Check-In Button */}
                    <button
                        onClick={handleCheckIn}
                        disabled={!!todayAttendance.checkIn || !!todayAttendance.checkOut}
                        className={`px-6 py-3 rounded-lg font-semibold ${todayAttendance.checkIn || todayAttendance.checkOut
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                    >
                        {todayAttendance.checkIn ? "Checked In" : "Check In"}
                    </button>

                    {/* ✅ Check-Out Button */}
                    <button
                        onClick={handleCheckOut}
                        disabled={
                            !todayAttendance.checkIn ||
                            !!todayAttendance.checkOut ||
                            !canCheckOut
                        }
                        className={`px-6 py-3 rounded-lg font-semibold ${!todayAttendance.checkIn ||
                            todayAttendance.checkOut ||
                            !canCheckOut
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                    >
                        {!todayAttendance.checkIn
                            ? "Check-In First"
                            : todayAttendance.checkOut
                                ? "Checked Out"
                                : !canCheckOut
                                    ? "Wait 4.5 Hours"
                                    : "Check Out"}
                    </button>
                </div>
            </div>

            {/* ✅ Calendar */}
            <CalendarTab profile={profile} />
        </div>
    );
}