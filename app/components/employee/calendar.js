'use client';
import React, { useState, useMemo, useContext } from 'react';
import MonthView from '../calendar/monthview';
import CalendarHeader from '../calendar/calendarheader';
import Calendar from '../calendar/calendar';
import RootContext from '../config/rootcontext';
import Loading from '../common/loading';
import { Mutated } from '../config/useswrfetch';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, parse, differenceInMinutes, parseISO, format, differenceInCalendarDays, isSameDay } from 'date-fns';
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


    // Withdraw leave service
    const withdrawLeaveService = async (employeeId, startDate, endDate) => {
        const res = await fetch(`/api/leave/delete?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`, {
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
    const handleWithdraw = async (employeeId, startDate, endDate, leaveDates) => {
        try {
            setLoadingLeave(startDate);

            await withdrawLeaveService(employeeId, startDate, endDate);

            // Local UI update
            const monthKeys = Object.keys(profile.attendance);
            monthKeys.forEach((month) => {
                profile.attendance[month] = profile.attendance[month].filter(
                    (l) => !leaveDates.includes(l.date)
                );
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
                    message: err.message || "Failed to withdraw leave. Try again.",
                },
            }));
        } finally {
            setLoadingLeave(null);
        }
    };

    const holidays = [
        '2025-01-01',
        '2025-01-26',
        '2025-03-25',
        '2025-08-15',
        '2025-10-02',
        '2025-10-18',
        '2025-10-20',
        '2025-12-25',
    ];

    const FULL_DAY_HOURS = 8.75; // 8h 45m
    const HALF_DAY_HOURS = 4.25; // 4h 15m

    const calculateAttendanceByMonthIndex = (profile, monthIndex, year = 2025) => {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[monthIndex];

        if (!profile || !profile.attendance || !profile.attendance[monthName]) {
            return {
                totalWorked: 0,
                totalWorkingDays: 0,
                totalCalendarDays: 0,
                holidaysCount: 0,
                sundaysCount: 0,
                presentLate: 0,
                earlyOut: 0,
                firstHalf: 0,
                secondHalf: 0,
                lossOfPay: 0,
                totalHoursWorked: 0,
                paidLeaves: 0
            };
        }

        const start = startOfMonth(new Date(year, monthIndex, 1));
        const end = endOfMonth(start);
        const monthDates = eachDayOfInterval({ start, end });

        const holidays = [
            '2025-01-01', '2025-01-26', '2025-03-25', '2025-08-15',
            '2025-10-02', '2025-10-18', '2025-10-20', '2025-12-25'
        ];

        // Calculate total calendar days in month
        const totalCalendarDays = monthDates.length;

        // Calculate Sundays and holidays
        let sundaysCount = 0;
        let holidaysCount = 0;
        let totalWorkingDays = 0;

        monthDates.forEach(date => {
            const formatted = format(date, 'yyyy-MM-dd');
            const isSundayFlag = isSunday(date);
            const isHoliday = holidays.includes(formatted);

            if (isSundayFlag) sundaysCount++;
            if (isHoliday) holidaysCount++;

            // Working days exclude Sundays and holidays
            if (!isSundayFlag && !isHoliday) {
                totalWorkingDays++;
            }
        });

        let totalWorked = 0;
        let totalHoursWorked = 0;
        let presentLate = 0;
        let earlyOut = 0;
        let firstHalf = 0;
        let secondHalf = 0;
        let cumulativeLateEarly = 0;
        let lossOfPay = 0;
        let paidLeaves = 0;

        // Count approved leaves (paid leaves)
        profile.attendance[monthName].forEach(item => {
            if (item.status === 'approved' || item.status === 'firstHalfApproved' || item.status === 'secondHalfApproved') {
                if (item.status === 'approved') {
                    paidLeaves += 1;
                } else if (item.status === 'firstHalfApproved' || item.status === 'secondHalfApproved') {
                    paidLeaves += 0.5;
                }
            }
        });

        // Calculate actual worked days
        profile.attendance[monthName].forEach(item => {
            // Count paid leaves as worked days
            if (item.status === 'approved') {
                totalWorked += 1;
                return;
            } else if (item.status === 'firstHalfApproved' || item.status === 'secondHalfApproved') {
                totalWorked += 0.5;
                return;
            }

            if (!item.checkIn || !item.checkOut) return; // skip incomplete records

            const checkIn = parse(item.checkIn, 'HH:mm', new Date());
            const checkOut = parse(item.checkOut, 'HH:mm', new Date());

            // Calculate worked hours in decimal
            const workedMinutes = differenceInMinutes(checkOut, checkIn);
            const workedHours = workedMinutes / 60;
            totalHoursWorked += workedHours;

            // Time thresholds
            const lateThreshold = parse('09:45', 'HH:mm', new Date()); // After 9:45 AM is late
            const earlyOutThreshold = parse('18:30', 'HH:mm', new Date()); // Before 6:30 PM is early out
            const secondHalfStart = parse('13:30', 'HH:mm', new Date()); // Second half starts at 1:30 PM

            // Check for late arrival (9:46 AM to 12:00 PM)
            if (checkIn > lateThreshold && checkIn <= parse('12:00', 'HH:mm', new Date())) {
                presentLate += 1;
                cumulativeLateEarly += 1;
            }

            // Check for early out (5:45 PM to 6:29 PM)
            if (checkOut >= parse('17:45', 'HH:mm', new Date()) && checkOut < earlyOutThreshold) {
                earlyOut += 1;
                cumulativeLateEarly += 1;
            }

            // Determine attendance type based on hours worked
            if (workedHours >= FULL_DAY_HOURS) {
                // Full day - 8.75 hours and above
                totalWorked += 1;
            } else if (workedHours >= HALF_DAY_HOURS && workedHours < FULL_DAY_HOURS) {
                // Half day - 4.25 to 8.74 hours
                totalWorked += 0.5;

                // Determine which half day
                if (checkIn < secondHalfStart) {
                    // First half (check-in before 1:30 PM)
                    firstHalf += 1;
                } else {
                    // Second half (check-in at/after 1:30 PM)
                    secondHalf += 1;
                }
            }

            // Calculate loss of pay (every 3 cumulative late/early = 1 loss of pay)
            if (cumulativeLateEarly >= 3) {
                const additionalLoss = Math.floor(cumulativeLateEarly / 3);
                lossOfPay += additionalLoss;
                cumulativeLateEarly = cumulativeLateEarly % 3;
            }
        });

        return {
            totalWorked: parseFloat(totalWorked.toFixed(2)),
            totalWorkingDays,
            totalCalendarDays,
            holidaysCount,
            sundaysCount,
            presentLate,
            earlyOut,
            firstHalf,
            secondHalf,
            lossOfPay,
            totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
            paidLeaves: parseFloat(paidLeaves.toFixed(2))
        };
    };

    const {
        totalWorked,
        totalWorkingDays,
        presentLate,
        earlyOut,
        firstHalf,
        secondHalf,
        lossOfPay,
        totalHoursWorked,
        paidLeaves
    } = calculateAttendanceByMonthIndex(profile, monthName);

    // Filter leaves dynamically for the month
    const monthLeaves = useMemo(() => {
        if (!profile || !profile.attendance) return [];
        const monthNamee = monthNames[monthIndex];
        const monthArr = profile.attendance[monthNamee] || [];

        // Filter pending leaves with leaveType
        const pendingLeaves = monthArr.filter(
            (item) => item.status === "pending" && item.leaveType
        );

        // Sort by date ascending
        pendingLeaves.sort((a, b) => new Date(a.date) - new Date(b.date));

        const grouped = [];
        let currentGroup = null;

        for (const leave of pendingLeaves) {
            const leaveDate = parseISO(leave.date);

            if (
                !currentGroup ||
                leave.leaveType !== currentGroup.leaveType ||
                differenceInCalendarDays(leaveDate, parseISO(currentGroup.endDate)) > 1
            ) {
                // start new range
                currentGroup = {
                    leaveType: leave.leaveType,
                    startDate: leave.date,
                    endDate: leave.date,
                    reason: leave.reason || "",
                    status: leave.status
                };
                grouped.push(currentGroup);
            } else {
                // extend range
                currentGroup.endDate = leave.date;
            }
        }

        return grouped;
    }, [profile, monthIndex]);

    const today = new Date();
    const lastDayOfMonth = endOfMonth(today);
    const isMonthEnd = isSameDay(today, lastDayOfMonth);

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
                {isMonthEnd && (
                    <div className="bg-green-100 py-2 text-center rounded-sm mb-2">
                        <p className="text-sm text-gray-500">
                            Working Days:{" "}
                            <span className="text-sm font-bold text-gray-700">{totalWorked}</span>{" "}
                            / {totalWorkingDays}
                        </p>
                        {/* Optional: uncomment if needed */}
                        {/* {paidLeaves > 0 && (
            <p className="text-xs text-gray-500 mt-1">
                (Includes {paidLeaves} paid leave)
            </p>
        )} */}
                    </div>
                )}

                {/* Combined Present Late & Early Out - Only show if greater than 0 */}
                {(presentLate > 0 || earlyOut > 0) && (
                    <div className="bg-yellow-100 p-2 text-center rounded-sm mb-2">
                        <p className="text-sm text-gray-500">
                            Present Late:{" "}
                            <span className="text-sm font-bold text-gray-700">{presentLate}</span>
                        </p>
                    </div>
                )}

                {/* First Half & Second Half - Only show if greater than 0 */}
                {(firstHalf > 0 || secondHalf > 0) && (
                    <div className="bg-red-100 p-2 text-center rounded-sm mb-2">
                        <p className="text-sm text-gray-500">
                            Half Days:{" "}
                            <span className="text-sm font-bold text-gray-700">
                                {firstHalf + secondHalf}
                            </span>
                            {(firstHalf > 0 || secondHalf > 0) && (
                                <span className="text-xs ml-2">
                                    ({firstHalf} first half, {secondHalf} second half)
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {lossOfPay > 0 && (
                    <div className="bg-red-100 p-2 text-center rounded-sm mb-2">
                        <p className="text-sm text-red-600 font-bold">
                            Loss of Pay Days: {lossOfPay}
                        </p>
                    </div>
                )}

                {/* ✅ Yesterday's Attendance Summary */}
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

                        totalHours = `${hours || 0} hrs ${minutes || 0} mins`;
                    }

                    return (
                        <div className="bg-blue-50 p-3 rounded-sm mb-3 border border-blue-200">
                            <p className="text-md text-center font-bold text-gray-700 mb-1">
                                Yesterday's Attendance
                            </p>
                            <p className='text-sm'>Check-in: <strong>{checkIn}</strong></p>
                            <p className='text-sm'>Check-out: <strong>{checkOut}</strong></p>
                            <p className="text-sm mt-1 text-gray-700">
                                Total Worked: <span className="font-bold text-blue-700">{totalHours}</span>
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
                                        Leave Period:{" "}
                                        <span className="font-bold text-gray-800">
                                            {formatDateTime(leave.startDate, "DD-MM-YYYY")}
                                            {leave.startDate !== leave.endDate && (
                                                <> to {formatDateTime(leave.endDate, "DD-MM-YYYY")}</>
                                            )}
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
                                            onClick={() =>
                                                handleWithdraw(
                                                    profile._id,
                                                    leave.startDate,
                                                    leave.endDate,
                                                    eachDayOfInterval({ start: parseISO(leave.startDate), end: parseISO(leave.endDate) })
                                                        .map(d => format(d, 'yyyy-MM-dd'))
                                                )
                                            }
                                            disabled={loadingLeave === leave.startDate}
                                            className={`px-2 py-1 text-xs rounded-md font-medium text-white ${loadingLeave === leave.startDate ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                                }`}
                                        >
                                            {loadingLeave === leave.startDate ? "Withdrawing..." : "Withdraw"}
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