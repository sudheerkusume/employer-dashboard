'use client';
import React, { useState, useMemo, useContext } from 'react';
import MonthView from '../calendar/monthview';
import CalendarHeader from '../calendar/calendarheader';
import Calendar from '../calendar/calendar';
import RootContext from '../config/rootcontext';
import Loading from '../common/loading';
import { Mutated } from '../config/useswrfetch';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, parse, differenceInMinutes, format } from 'date-fns';
import { formatDateTime } from '../config/sitesettings';

const categoryColors = {
    present: "#22c55e",
    firstHalf: "#fbbf24",
    secondHalf: "#f59e0b",
    halfDay: "#f97316",
    absent: "#ef4444",
    "Checked In": "#3b82f6",
};

export default function CalendarTab({ profile, onCheckIn, onCheckOut, isCheckedIn }) {
    const myDate = new Date();
    const [currentDate, setCurrentDate] = useState(myDate);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loadingLeave, setLoadingLeave] = useState(null);
    const { setRootContext } = useContext(RootContext);
    const [serviceCall, setServiceCall] = useState(false);

    const nav = (dir) => {
        const delta = dir === 'next' ? 1 : -1;
        setCurrentDate(prev => addMonths(prev, delta));
    };
    const mutated = Mutated(profile ? `/api/employees?id=${profile._id}` : null)

    const events = useMemo(() => {
        if (!profile || !profile.attendance) return [];
        const allEvents = [];
        Object.keys(profile.attendance).forEach(month => {
            profile.attendance[month].forEach(item => {
                const eventDate = new Date(item.date);
                allEvents.push({
                    ...item,
                    start: eventDate,
                    end: eventDate,
                    type: item.status || 'present',
                });
            });
        });
        return allEvents;
    }, [profile]);

    // // ✅ Filter leaves dynamically from attendance
    // const leaves = useMemo(() => {
    //     if (!profile || !profile.attendance) return [];
    //     const allLeaves = [];
    //     Object.values(profile.attendance).forEach(monthArr => {
    //         monthArr.forEach(item => {
    //             if (item.status && item.leaveType) {
    //                 allLeaves.push({
    //                     id: item.date, // you can make this unique if needed
    //                     ...item
    //                 });
    //             }
    //         });
    //     });
    //     return allLeaves;
    // }, [profile]);

    // Withdraw leave service
    const withdrawLeaveService = async (leaveDate) => {
        const res = await fetch(`/api/leave/delete?employeeId=${profile._id}&leaveDate=${leaveDate}`, {
            method: 'DELETE',
        });
        setServiceCall(true)
        if (res.status) {
            setServiceCall(false)
        }
        if (!res.ok) {
            const data = await res.json();
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: `Failed`,
                    message: `${data?.error}` || 'Failed to withdraw leave',
                },
            }));
        } else {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "success",
                    title: `success`,
                    message: `Leave withdraw successfully`,
                },
            }));
            mutated()
        }
    };
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get current month name from currentDate
    const monthIndex = currentDate.getMonth();
    const [monthName, setMonthName] = useState(monthIndex || 1);
    const handleWithdraw = async (leaveDate) => {
        try {
            setLoadingLeave(leaveDate);
            await withdrawLeaveService(leaveDate);
            // Since leaves are derived from attendance, we need to refetch profile or remove locally
            // Here we remove locally for instant UI update
            const monthKeys = Object.keys(profile.attendance);
            monthKeys.forEach(month => {
                profile.attendance[month] = profile.attendance[month].filter(l => l.date !== leaveDate);
            });
        } catch (err) {
            console.error("Withdraw failed:", err);
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: `Failed`,
                    message: `${err.message}` || "Failed to withdraw leave. Try again.",
                },
            }));
        } finally {
            setLoadingLeave(null);
        }
    };


    const holidays = [
        '2025-10-02',
        '2025-10-15',
    ];

    const FULL_DAY_HOURS = 8.75; // 8h 45m
    const HALF_DAY_HOURS = 4.25; // 4h 15m

    const calculateAttendanceByMonthIndex = (profile, monthIndex, year = 2025) => {
        const monthName = monthNames[monthIndex];
        if (!profile || !profile.attendance || !profile.attendance[monthName]) {
            return { totalWorked: 0, totalWorkingDays: 0 };
        }

        // ✅ Step 1: Calculate total working days (excluding Sundays & holidays)
        const start = startOfMonth(new Date(year, monthIndex, 1));
        const end = endOfMonth(start);
        const monthDates = eachDayOfInterval({ start, end });

        let totalWorkingDays = monthDates.reduce((acc, date) => {
            const formatted = date.toISOString().split('T')[0];
            if (!isSunday(date) && !holidays.includes(formatted)) acc += 1;
            return acc;
        }, 0);

        // ✅ Step 2: Calculate total worked days
        let totalWorkedDays = 0;

        profile.attendance[monthName].forEach(item => {
            const status = item.status;

            if (status === 'present') {
                totalWorkedDays += 1;
            }
            else if (
                status === 'firstHalfApproved' ||
                status === 'secondHalfApproved' ||
                status === 'halfDay'
            ) {
                totalWorkedDays += 0.5;
            }
            else if (status === 'approved') {
                // ✅ Paid leave — count as working day (but not worked day)
                // So do nothing here (don’t reduce total working days)
            }
            else if (status === 'Checked In' || status === 'rejected') {
                // Skip incomplete or rejected leaves
            }
            else if (item.checkIn && item.checkOut) {
                const checkInTime = parse(item.checkIn, 'HH:mm', new Date());
                const checkOutTime = parse(item.checkOut, 'HH:mm', new Date());
                const workedMinutes = differenceInMinutes(checkOutTime, checkInTime);
                const workedHours = workedMinutes / 60;

                // ✅ Normalize to 1 or 0.5 day based on hours
                if (workedHours >= FULL_DAY_HOURS) {
                    totalWorkedDays += 1;
                } else if (workedHours >= HALF_DAY_HOURS) {
                    totalWorkedDays += 0.5;
                }
            }
        });

        const totalWorked = parseFloat(totalWorkedDays.toFixed(2));

        return { totalWorked, totalWorkingDays };
    };

    const { totalWorked, totalWorkingDays } = calculateAttendanceByMonthIndex(profile, monthName);


    // Filter leaves dynamically for the month
    // ✅ Show only pending leaves for the current month
    const monthLeaves = useMemo(() => {
        if (!profile || !profile.attendance) return [];
        const monthNamee = monthNames[monthIndex];
        const monthArr = profile.attendance[monthNamee] || [];

        return monthArr.filter(item =>
            item.status === "pending" && item.leaveType
        );
    }, [profile, monthName]);

    return (
        <div className="flex flex-col md:flex-row max-w-full text-gray-700 gap-4">
            {serviceCall && <Loading />}

            {/* Left Calendar Section */}
            <div className="flex-1">
                <Calendar
                    profile={profile}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                    isCheckedIn={isCheckedIn}
                    onGoToCalendar={() => setShowCalendar(true)}
                    setMonthName={setMonthName}
                />
            </div>

            {/* Right Side: Leaves Section */}
            <aside className="w-full md:w-80 bg-white shadow-lg rounded-xl sm:p-4 flex flex-col">
                {/* ✅ Working Days */}
                <div className="bg-yellow-100 py-2 text-center rounded-sm mb-2">
                    <p className="text-sm text-gray-500">
                        Working Days:{" "}
                        <span className="text-sm font-bold text-gray-700">{totalWorked}</span>{" "}
                        / {totalWorkingDays}
                    </p>
                </div>

                {/* ✅ Yesterday’s Attendance Summary */}
                {(() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split("T")[0];

                    const monthNameNow = monthNames[yesterday.getMonth()];
                    const yesterdayData =
                        profile.attendance?.[monthNameNow]?.find(
                            (d) => d.date === yesterdayStr
                        ) || null;

                    if (!yesterdayData) {
                        return (
                            <div className="bg-gray-100 text-center py-2 rounded-xl mb-3">
                                <p className="text-sm text-gray-600 italic">
                                    No attendance record for yesterday.
                                </p>
                            </div>
                        );
                    }

                    const checkIn = yesterdayData.checkIn || "—";
                    const checkOut = yesterdayData.checkOut || "—";
                    let totalHours = "—";

                    if (checkIn && checkOut) {
                        const inTime = parse(checkIn, "HH:mm", new Date());
                        const outTime = parse(checkOut, "HH:mm", new Date());
                        const minutesWorked = differenceInMinutes(outTime, inTime);

                        const hours = Math.floor(minutesWorked / 60);
                        const minutes = minutesWorked % 60;

                        totalHours = `${hours} hrs ${minutes} mins`;
                    }

                    return (
                        <div className="bg-green-50 p-3 rounded-sm mb-3 border border-green-200">
                            <p className="text-md text-center font-bold text-gray-700 mb-1">
                                Yesterday's Attendance
                            </p>
                            <p className='text-sm'>Check-in: <strong>{checkIn}</strong></p>
                            <p className='text-sm'>Check-out: <strong>{checkOut}</strong></p>
                            <p className="text-sm mt-1 text-gray-700">
                                Total Worked: <span className="font-bold text-green-700">{totalHours}</span>
                            </p>
                        </div>

                    );
                })()}

                {/* ✅ Leaves Section */}
                <h3 className="text-lg font-semibold mb-3">Your Leaves</h3>

                {monthLeaves.length === 0 ? (
                    <p className="text-gray-400 italic">No leave applied.</p>
                ) : (
                    <ul className="space-y-2 overflow-y-auto max-h-[500px]">
                        {monthLeaves.map((leave, index) => (
                            <li
                                key={index}
                                className="flex justify-between capitalize items-center p-2 border border-gray-200 rounded-md"
                            >
                                <div className="flex flex-col text-sm">
                                    <p className="font-medium text-gray-500">
                                        Leave Type:{" "}
                                        <span className="font-bold text-gray-800">
                                            {leave.leaveType}
                                        </span>
                                    </p>
                                    <p className="font-medium text-gray-500">
                                        Applied Date:{" "}
                                        <span className="font-bold text-gray-800">
                                            {formatDateTime(leave.date, "DD-MM-YYYY")}
                                        </span>
                                    </p>
                                    <p className="font-medium text-gray-500">
                                        Status:{" "}
                                        <span
                                            className={`font-bold ${leave.status === "approved"
                                                ? "text-green-600"
                                                : "text-yellow-500"
                                                }`}
                                        >
                                            {leave.status}
                                        </span>
                                    </p>
                                </div>
                                {leave.status !== "approved" &&
                                    leave.status !== "rejected" &&
                                    leave.status !== "firstHalfApproved" &&
                                    leave.status !== "secondHalfApproved" && (
                                        <button
                                            onClick={() => handleWithdraw(leave.date)}
                                            disabled={loadingLeave === leave.date}
                                            className={`px-2 py-1 text-xs rounded-md font-medium text-white ${loadingLeave === leave.id
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-red-600 hover:bg-red-700"
                                                }`}
                                        >
                                            {loadingLeave === leave.id ? "Withdrawing..." : "Withdraw"}
                                        </button>
                                    )}
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
}
