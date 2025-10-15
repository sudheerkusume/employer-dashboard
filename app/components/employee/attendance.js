"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function Attendance() {
    // Employee working hours configuration
    const WORKING_HOURS = {
        fullDay: 9, // 9 hours for full day
        halfDay: 4, // Minimum 4 hours for half day
        firstHalfEnd: moment().set({ hour: 13, minute: 0, second: 0 }), // 1:00 PM
        secondHalfStart: moment().set({ hour: 13, minute: 1, second: 0 }), // 1:01 PM
        officeStart: moment().set({ hour: 9, minute: 0, second: 0 }), // 9:00 AM
        officeEnd: moment().set({ hour: 18, minute: 0, second: 0 }), // 6:00 PM
    };

    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Present (9hrs)",
            start: new Date(2025, 9, 1),
            end: new Date(2025, 9, 1),
            type: "present",
            status: "approved",
            checkIn: "09:00 AM",
            checkOut: "06:00 PM",
            workingHours: 9
        },
        {
            id: 2,
            title: "First Half (4.5hrs)",
            start: new Date(2025, 9, 2),
            end: new Date(2025, 9, 2),
            type: "firstHalf",
            status: "approved",
            checkIn: "09:00 AM",
            checkOut: "01:30 PM",
            workingHours: 4.5
        },
        {
            id: 3,
            title: "Second Half (4hrs)",
            start: new Date(2025, 9, 3),
            end: new Date(2025, 9, 3),
            type: "secondHalf",
            status: "approved",
            checkIn: "02:00 PM",
            checkOut: "06:00 PM",
            workingHours: 4
        },
        {
            id: 4,
            title: "Absent",
            start: new Date(2025, 9, 4),
            end: new Date(2025, 9, 4),
            type: "absent",
            status: "approved",
            checkIn: "-",
            checkOut: "-",
            workingHours: 0
        },
        {
            id: 5,
            title: "Holiday",
            start: new Date(2025, 9, 5),
            end: new Date(2025, 9, 5),
            type: "holiday",
            status: "approved"
        },
    ]);

    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
    const [leaveReason, setLeaveReason] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState({
        checkIn: "",
        checkOut: "",
        date: new Date(),
        checkInTime: null
    });
    const [canCheckOut, setCanCheckOut] = useState(false);

    // Check if 4 hours have passed since check-in
    useEffect(() => {
        let interval;
        if (todayAttendance.checkInTime && !todayAttendance.checkOut) {
            interval = setInterval(() => {
                const now = moment();
                const checkInTime = moment(todayAttendance.checkInTime);
                const hoursWorked = now.diff(checkInTime, 'hours', true);

                setCanCheckOut(hoursWorked >= 4);
            }, 60000); // Check every minute
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [todayAttendance.checkInTime, todayAttendance.checkOut]);

    // Color palette
    const colors = {
        present: "#22c55e",      // Green
        firstHalf: "#fbbf24",    // Amber
        secondHalf: "#f59e0b",   // Orange
        absent: "#ef4444",       // Red
        holiday: "#3b82f6",      // Blue
        pending: "#9ca3af",      // Gray
    };

    // Calculate attendance status based on check-in/check-out times
    const calculateAttendanceStatus = (checkInTime, checkOutTime) => {
        if (!checkInTime || !checkOutTime) return "absent";

        const checkIn = moment(checkInTime, "HH:mm A");
        const checkOut = moment(checkOutTime, "HH:mm A");

        // Calculate working hours
        const workingHours = checkOut.diff(checkIn, 'hours', true);

        // Determine attendance status
        if (workingHours >= WORKING_HOURS.fullDay - 1) { // 8+ hours considering buffer
            return "present";
        } else if (workingHours >= WORKING_HOURS.halfDay) {
            // Check if it's first half or second half
            const isFirstHalf = checkIn.isBefore(WORKING_HOURS.firstHalfEnd);
            return isFirstHalf ? "firstHalf" : "secondHalf";
        } else {
            return "absent";
        }
    };

    // Get title based on attendance type and hours
    const getAttendanceTitle = (type, workingHours) => {
        const titles = {
            present: `Present (${workingHours}hrs)`,
            firstHalf: `First Half (${workingHours}hrs)`,
            secondHalf: `Second Half (${workingHours}hrs)`,
            absent: "Absent",
            holiday: "Holiday",
            pending: "Leave (Pending)"
        };
        return titles[type] || type;
    };

    const CustomEvent = ({ event }) => (
        <div className="flex flex-col justify-center items-center h-full w-full text-black font-semibold text-xs p-1">
            <span>{event.title}</span>
            {event.checkIn && event.checkOut && event.type !== 'holiday' && (
                <span className="text-xs font-normal">
                    {event.checkIn} - {event.checkOut}
                </span>
            )}
        </div>
    );

    // Event style getter with conditional styling
    const eventStyleGetter = (event) => {
        const backgroundColor = event.status === "pending" ? colors.pending : colors[event.type];

        return {
            style: {
                backgroundColor: backgroundColor,
                borderRadius: "4px",
                opacity: 1,
                color: "black",
                border: "none",
                display: "block",
                width: "100%",
                height: "100%",
                textAlign: "center",
                boxSizing: "border-box",
                padding: "2px",
            },
        };
    };

    // Handle date range selection for leave
    const handleSelectSlot = (slotInfo) => {
        const start = slotInfo.start;
        const end = slotInfo.end;

        // Check if both start and end dates are selected (multi-day range)
        const isMultiDayRange = moment(start).isBefore(end, "day");

        if (isMultiDayRange) {
            setSelectedRange({ start, end });
            setIsModalOpen(true);
        } else {
            // For single day selection, set both start and end to the same date
            setSelectedRange({ start, end: start });
            setIsModalOpen(true);
        }
    };

    // Send email notification to manager
    const sendEmailNotification = (leaveData) => {
        const managerEmail = "manager@company.com"; // Replace with actual manager email
        const subject = `Leave Application - ${moment(leaveData.start).format("MMM Do, YYYY")} to ${moment(leaveData.end).format("MMM Do, YYYY")}`;
        const body = `
            New leave application submitted:
            
            Employee: John Doe
            Leave Period: ${moment(leaveData.start).format("MMM Do, YYYY")} to ${moment(leaveData.end).format("MMM Do, YYYY")}
            Reason: ${leaveData.reason}
            Applied On: ${moment(leaveData.appliedDate).format("MMM Do, YYYY h:mm A")}
            
            Please review and approve/reject the leave application.
        `;

        // Using mailto for email notification (in real app, use backend API)
        const mailtoLink = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        // For production, you would use an API call:
        // fetch('/api/send-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ to: managerEmail, subject, body })
        // });
    };

    // Apply for leave (add to pending leaves)
    const handleApplyLeave = () => {
        const { start, end } = selectedRange;
        if (!leaveReason.trim()) return alert("Please enter a reason!");
        if (!start || !end) return alert("Please select a date range first!");

        const newLeave = {
            id: Date.now(),
            title: "Leave (Pending)",
            start,
            end: moment(end).endOf("day").toDate(),
            type: "leave",
            status: "pending",
            reason: leaveReason,
            appliedDate: new Date(),
        };

        setPendingLeaves([...pendingLeaves, newLeave]);

        // Send email notification to manager
        sendEmailNotification(newLeave);

        setIsModalOpen(false);
        setLeaveReason("");
        setSelectedRange({ start: null, end: null });
        alert("Leave application submitted! Notification sent to manager.");
    };

    // Approve a pending leave
    const handleApproveLeave = (leaveId) => {
        const leaveToApprove = pendingLeaves.find(leave => leave.id === leaveId);
        if (!leaveToApprove) return;

        const approvedLeave = {
            ...leaveToApprove,
            title: "Leave",
            status: "approved"
        };

        // Add to events (calendar)
        setEvents([...events, approvedLeave]);

        // Remove from pending leaves
        setPendingLeaves(pendingLeaves.filter(leave => leave.id !== leaveId));

        alert("Leave approved successfully!");
    };

    // Reject a pending leave
    const handleRejectLeave = (leaveId) => {
        setPendingLeaves(pendingLeaves.filter(leave => leave.id !== leaveId));
        alert("Leave rejected!");
    };

    // Handle check-in
    const handleCheckIn = () => {
        const now = new Date();
        const checkInTime = moment(now).format("HH:mm A");

        setTodayAttendance({
            ...todayAttendance,
            checkIn: checkInTime,
            date: now,
            checkInTime: now
        });

        setCanCheckOut(false); // Reset check-out availability
        setIsCheckInModalOpen(false);
        alert(`Checked in at ${checkInTime}. You can check out after 4 hours.`);
    };

    // Handle check-out and calculate attendance
    const handleCheckOut = () => {
        const now = new Date();
        const checkOutTime = moment(now).format("HH:mm A");

        if (!todayAttendance.checkIn) {
            alert("Please check in first!");
            return;
        }

        // Check if minimum 4 hours have passed
        const checkInMoment = moment(todayAttendance.checkInTime);
        const hoursWorked = moment(now).diff(checkInMoment, 'hours', true);

        if (hoursWorked < 4) {
            alert(`You need to work at least 4 hours before checking out. Current: ${hoursWorked.toFixed(1)} hours`);
            return;
        }

        const workingHours = calculateWorkingHours(todayAttendance.checkIn, checkOutTime);
        const attendanceType = calculateAttendanceStatus(todayAttendance.checkIn, checkOutTime);

        // Create new attendance record
        const newAttendance = {
            id: Date.now(),
            title: getAttendanceTitle(attendanceType, workingHours),
            start: todayAttendance.date,
            end: todayAttendance.date,
            type: attendanceType,
            status: "approved",
            checkIn: todayAttendance.checkIn,
            checkOut: checkOutTime,
            workingHours: workingHours
        };

        // Add to events
        setEvents([...events, newAttendance]);

        // Reset today's attendance
        setTodayAttendance({
            checkIn: "",
            checkOut: "",
            date: new Date(),
            checkInTime: null
        });

        setCanCheckOut(false);

        alert(`Checked out at ${checkOutTime}. Working hours: ${workingHours}hrs - ${attendanceType}`);
    };

    // Calculate working hours between check-in and check-out
    const calculateWorkingHours = (checkInTime, checkOutTime) => {
        const checkIn = moment(checkInTime, "HH:mm A");
        const checkOut = moment(checkOutTime, "HH:mm A");
        return parseFloat(checkOut.diff(checkIn, 'hours', true).toFixed(1));
    };

    const calendarEvents = useMemo(() => {
        return events.filter(event => event.status === "approved");
    }, [events]);

    const defaultDate = useMemo(() => new Date(2025, 9, 1), []);
    const startDateStr = selectedRange.start ? moment(selectedRange.start).format("MMM Do, YYYY") : "N/A";
    const endDateStr = selectedRange.end ? moment(selectedRange.end).format("MMM Do, YYYY") : "N/A";

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 sm:p-8 space-y-6">
            {/* Check-in/Check-out Section */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                    Today's Attendance
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600">Check-in Time</p>
                            <p className="text-lg font-bold text-gray-800">
                                {todayAttendance.checkIn || "Not checked in"}
                            </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600">Check-out Time</p>
                            <p className="text-lg font-bold text-gray-800">
                                {todayAttendance.checkOut || "Not checked out"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCheckInModalOpen(true)}
                            disabled={todayAttendance.checkIn}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${todayAttendance.checkIn
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                        >
                            Check In
                        </button>
                        <button
                            onClick={handleCheckOut}
                            disabled={!canCheckOut || todayAttendance.checkOut}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${(!canCheckOut || todayAttendance.checkOut)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                                }`}
                        >
                            {!canCheckOut && todayAttendance.checkIn ? "Wait 4 Hours" : "Check Out"}
                        </button>
                    </div>
                </div>

                {/* Check-out Info */}
                {todayAttendance.checkIn && !todayAttendance.checkOut && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 text-center">
                            {!canCheckOut ? (
                                "You need to complete 4 hours before checking out"
                            ) : (
                                "You can now check out (4+ hours completed)"
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Calendar Section */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                    Attendance Calendar <span className="text-sm text-gray-500">(Drag to select leave range)</span>
                </h2>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        selectable
                        onSelectSlot={handleSelectSlot}
                        defaultDate={defaultDate}
                        style={{ height: 500 }}
                        eventPropGetter={eventStyleGetter}
                        components={{ event: CustomEvent }}
                    />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 text-sm font-medium text-gray-600">
                    {Object.entries(colors).map(([type, color]) => (
                        <span key={type} className="flex items-center">
                            <span className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: color }}></span>
                            {type === 'firstHalf' ? 'First Half' :
                                type === 'secondHalf' ? 'Second Half' :
                                    type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Pending Leaves Section */}
            {pendingLeaves.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-2xl">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                        Pending Leave Applications
                    </h2>
                    <div className="space-y-4">
                        {pendingLeaves.map((leave) => (
                            <div key={leave.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {moment(leave.start).format("MMM Do, YYYY")} - {moment(leave.end).format("MMM Do, YYYY")}
                                        </p>
                                        <p className="text-gray-600 mt-1">{leave.reason}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Applied: {moment(leave.appliedDate).format("MMM Do, YYYY h:mm A")}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApproveLeave(leave.id)}
                                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-600 transition"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRejectLeave(leave.id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Check-in Modal */}
            {isCheckInModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Check In</h3>
                            <button
                                onClick={() => setIsCheckInModalOpen(false)}
                                className="text-gray-500 hover:text-gray-800 transition text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Current time: {moment().format("hh:mm A")}
                        </p>
                        <p className="text-sm text-orange-600 mb-4 bg-orange-50 p-3 rounded-lg">
                            Note: You can only check out after completing 4 hours of work.
                        </p>
                        <button
                            onClick={handleCheckIn}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            Confirm Check In
                        </button>
                    </div>
                </div>
            )}

            {/* Leave Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-end z-50">
                    <div className="bg-white w-full max-w-md rounded-t-2xl p-6 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Apply for Leave 📝</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-800 transition text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-md mb-3 text-gray-600">
                            From: <span className="font-bold text-blue-600">{startDateStr}</span> to{" "}
                            <span className="font-bold text-blue-600">{endDateStr}</span>
                        </p>

                        <textarea
                            placeholder="Enter reason for leave"
                            value={leaveReason}
                            rows={4}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            Notification will be sent to your manager for approval.
                        </p>
                        <button
                            onClick={handleApplyLeave}
                            className="w-full bg-blue-600 text-white py-3 mt-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Submit Leave Request
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}