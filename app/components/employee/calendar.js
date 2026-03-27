'use client';
import React, { useState, useMemo, useContext } from 'react';
import Calendar from '../calendar/calendar';
import RootContext from '../config/rootcontext';
import Loading from '../common/loading';
import { Mutated } from '../config/useswrfetch';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, parse, differenceInMinutes, parseISO, format, differenceInCalendarDays, isSameDay, addMonths, getDay, isLastDayOfMonth, isBefore, getDate } from 'date-fns';
import { formatDateTime } from '../config/sitesettings';
import CalendarModal from '../calendar/calendarmodal';

// --- Enhanced Attendance Regularization (AR) Form ---
function ARForm({ defaultDate, onClose, onSubmit, submitting }) {
    const today = new Date();
    const maxPastDate = new Date();
    maxPastDate.setDate(today.getDate() - 3); // 3 days back from today

    const [dateFrom, setDateFrom] = useState(defaultDate || format(maxPastDate, 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(defaultDate || format(maxPastDate, 'yyyy-MM-dd'));
    const [checkIn, setInTime] = useState('09:30');
    const [checkOut, setOutTime] = useState('18:30');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    // Validate dates
    const validateDates = (fromDate, toDate) => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const today = new Date();

        // Reset error
        setError('');

        // Check if dates are in future
        if (from > today || to > today) {
            setError('Cannot apply AR for future dates. Only past dates are allowed.');
            return false;
        }

        // Check if dates are more than 3 days back
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        if (from < threeDaysAgo || to < threeDaysAgo) {
            setError('AR can only be applied for the past 3 days.');
            return false;
        }

        // Check if from date is after to date
        if (from > to) {
            setError('From date cannot be after To date.');
            return false;
        }

        return true;
    };

    const handleDateFromChange = (e) => {
        const newDateFrom = e.target.value;
        setDateFrom(newDateFrom);

        // If dateTo is before new dateFrom, update dateTo to match
        if (dateTo && newDateFrom > dateTo) {
            setDateTo(newDateFrom);
        }

        validateDates(newDateFrom, dateTo || newDateFrom);
    };

    const handleDateToChange = (e) => {
        const newDateTo = e.target.value;
        setDateTo(newDateTo);
        validateDates(dateFrom, newDateTo);
    };

    const handleSubmit = () => {
        if (!validateDates(dateFrom, dateTo)) {
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for attendance regularization.');
            return;
        }

        if (!checkIn || !checkOut) {
            setError('Please provide both check-in and check-out times.');
            return;
        }

        // Check if check-out is before check-in
        const [inHours, inMinutes] = checkIn.split(':').map(Number);
        const [outHours, outMinutes] = checkOut.split(':').map(Number);

        if (outHours < inHours || (outHours === inHours && outMinutes <= inMinutes)) {
            setError('Check-out time must be after check-in time.');
            return;
        }

        onSubmit({ dateFrom, dateTo, checkIn, checkOut, reason });
    };

    // Calculate min and max dates for date inputs
    const minDate = format(maxPastDate, 'yyyy-MM-dd');
    const maxDate = format(today, 'yyyy-MM-dd');

    return (
        <div className="relative bg-white text-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 transition-all duration-300 border border-gray-700">
            {/* Header */}
            <h3 className="text-2xl font-semibold mb-4 text-[#FFD700] flex items-center gap-2">
                🕒 Attendance Regularization
            </h3>

            {/* Info Message */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> AR can only be applied for the past 3 days. Today is {format(today, 'MMM dd, yyyy')}.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-sm text-gray-900 mb-1">From Date *</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={handleDateFromChange}
                        min={minDate}
                        max={maxDate}
                        className="w-full bg-white text-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-none focus:ring-2 focus:ring-[#FFD700]"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-900 mb-1">To Date *</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={handleDateToChange}
                        min={dateFrom || minDate}
                        max={maxDate}
                        className="w-full bg-white text-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-none focus:ring-2 focus:ring-[#FFD700]"
                        required
                    />
                </div>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-sm text-gray-900 mb-1">In Time *</label>
                    <input
                        type="time"
                        value={checkIn}
                        onChange={(e) => setInTime(e.target.value)}
                        className="w-full bg-white text-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-none focus:ring-2 focus:ring-[#FFD700]"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-900 mb-1">Out Time *</label>
                    <input
                        type="time"
                        value={checkOut}
                        onChange={(e) => setOutTime(e.target.value)}
                        className="w-full bg-white text-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-none focus:ring-2 focus:ring-[#FFD700]"
                        required
                    />
                </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
                <label className="block text-sm text-gray-900 mb-1">Reason *</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why you're requesting this adjustment..."
                    className="w-full bg-white text-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-none focus:ring-2 focus:ring-[#FFD700]"
                    required
                />
                <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/500 characters
                </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className={`px-4 py-2 rounded-lg text-black font-semibold transition ${submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#FFD700] hover:bg-yellow-400'
                        }`}
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            {/* Subtle glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-yellow-400/10 to-transparent pointer-events-none" />
        </div>
    );
}


export default function CalendarTab({ profile, onCheckIn, onCheckOut, isCheckedIn }) {
    const myDate = new Date();
    const [currentDate, setCurrentDate] = useState(myDate);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loadingLeave, setLoadingLeave] = useState(null);
    const { setRootContext } = useContext(RootContext);
    const [serviceCall, setServiceCall] = useState(false);

    const mutated = Mutated(profile ? `/api/employees?id=${profile._id}` : null)

    // --- New: AR state ---
    const [showARModal, setShowARModal] = useState(false);
    const [arSubmitting, setArSubmitting] = useState(false);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get current month from Calendar component
    const [currentMonth, setCurrentMonth] = useState(myDate.getMonth());

    // Handle month change from Calendar component
    const handleMonthChange = (monthIndex) => {
        setCurrentMonth(monthIndex);
    };

    const FULL_DAY_HOURS = 8.45; // 8h 27m (8.45 hours)
    const HALF_DAY_HOURS = 4.00; // 4 hours

    // Helper function to calculate working hours from check-in/check-out
    const calculateWorkingHours = (checkIn, checkOut, date, status) => {
        if (!checkIn || !checkOut) return 0;

        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        const start = inH * 60 + inM;
        const end = outH * 60 + outM;

        let diffMinutes = Math.max(0, end - start);

        // Handle half-day approved leaves
        if (status === 'firsthalfapproved') {
            // First half: check-in 9:00-9:45, check-out 13:30+
            return 4.0; // 4 hours for first half
        } else if (status === 'secondhalfapproved') {
            // Second half: check-in 13:00-13:45, check-out 18:30+
            return 4.0; // 4 hours for second half
        }

        // Adjust for lunch break based on day for full days
        const day = getDay(new Date(date));
        if (day !== 6) { // Not Saturday
            diffMinutes = Math.max(0, diffMinutes - 60);
        } else {
            diffMinutes = Math.max(0, diffMinutes - 30);
        }

        return diffMinutes / 60; // hours as decimal
    };

    // Check if date is before date of joining
    const isBeforeDateOfJoining = (date) => {
        if (!profile?.dateOfJoining) return false;
        const doj = new Date(profile.dateOfJoining);
        const checkDate = new Date(date);
        return isBefore(checkDate, doj);
    };

    const calculateAttendanceByMonthIndex = (profile, monthIndex, year = 2025) => {
        const monthName = monthNames[monthIndex];

        // Get the actual month start and end dates
        const start = startOfMonth(new Date(year, monthIndex, 1));
        const end = endOfMonth(start);
        const monthDates = eachDayOfInterval({ start, end });

        const holidays = [
            '2025-01-01', '2025-01-26', '2025-03-25', '2025-08-15',
            '2025-10-02', '2025-10-18', '2025-10-20', '2025-12-25'
        ];

        // Calculate total calendar days in month
        const totalCalendarDays = monthDates.length;

        // Calculate Sundays, holidays, and working days
        let sundaysCount = 0;
        let holidaysCount = 0;
        let totalWorkingDays = totalCalendarDays;
        let tuesdaysCount = 0;

        monthDates.forEach(date => {
            const formatted = format(date, 'yyyy-MM-dd');
            const isSundayFlag = isSunday(date);
            const isHoliday = holidays.includes(formatted);
            const isTuesday = getDay(date) === 2;

            if (isSundayFlag) sundaysCount++;
            if (isHoliday) holidaysCount++;
            if (isTuesday) tuesdaysCount++;
        });

        // Calculate actual working days (excluding Sundays, holidays, and tech Tuesdays)
        let actualWorkingDays = totalCalendarDays - sundaysCount - holidaysCount;
        if (profile?.department === "tech") {
            actualWorkingDays -= tuesdaysCount;
        }

        // Initialize counters
        let totalWorked = 0;
        let totalHoursWorked = 0;
        let presentLate = 0;
        let earlyOut = 0;
        let firstHalf = 0;
        let secondHalf = 0;
        let cumulativeLateEarly = 0;
        let lossOfPay = 0;
        let paidLeaves = 0;
        let absentDays = 0;
        let presentDays = 0;

        // Track all dates that should be marked as absent
        const absentDateSet = new Set();

        // Process attendance data for the month
        if (profile && profile.attendance && profile.attendance[monthName]) {
            profile.attendance[monthName].forEach(item => {
                // Skip if date is before date of joining
                if (isBeforeDateOfJoining(item.date)) {
                    return;
                }

                // Handle approved leaves (paid leaves)
                if (item.status === 'approved' || item.status === 'firstHalfApproved' || item.status === 'secondHalfApproved') {
                    if (item.status === 'approved') {
                        paidLeaves += 1;
                        totalWorked += 1;
                        presentDays += 1;
                    } else if (item.status === 'firstHalfApproved' || item.status === 'secondHalfApproved') {
                        paidLeaves += 0.5;
                        totalWorked += 0.5;
                        presentDays += 0.5;
                    }
                    return;
                }

                // Handle present status
                if (item.status === 'present' || item.status === 'presentLate') {
                    let workingHours = 0;

                    if (item.workingHours && typeof item.workingHours === 'string') {
                        workingHours = parseFloat(item.workingHours.toString().replace('hrs', '').trim()) || 0;
                    } else if (item.checkIn && item.checkOut) {
                        workingHours = calculateWorkingHours(item.checkIn, item.checkOut, item.date);
                    }

                    totalHoursWorked += workingHours;
                    presentDays += 1;

                    // Time thresholds
                    const lateThreshold = parse('09:45', 'HH:mm', new Date());
                    const earlyOutThreshold = parse('18:30', 'HH:mm', new Date());

                    // Check for late arrival
                    if (item.checkIn) {
                        const checkInTime = parse(item.checkIn, 'HH:mm', new Date());
                        if (checkInTime > lateThreshold && checkInTime <= parse('12:00', 'HH:mm', new Date())) {
                            presentLate += 1;
                            cumulativeLateEarly += 1;
                        }
                    }

                    // Check for early out
                    if (item.checkOut) {
                        const checkOutTime = parse(item.checkOut, 'HH:mm', new Date());
                        if (checkOutTime >= parse('17:45', 'HH:mm', new Date()) && checkOutTime < earlyOutThreshold) {
                            earlyOut += 1;
                            cumulativeLateEarly += 1;
                        }
                    }

                    if (workingHours >= FULL_DAY_HOURS) {
                        totalWorked += 1;
                    } else if (workingHours >= HALF_DAY_HOURS && workingHours < FULL_DAY_HOURS) {
                        totalWorked += 0.5;
                        if (item.checkIn) {
                            const checkInTime = parse(item.checkIn, 'HH:mm', new Date());
                            const secondHalfStart = parse('13:30', 'HH:mm', new Date());
                            if (checkInTime < secondHalfStart) {
                                firstHalf += 1;
                            } else {
                                secondHalf += 1;
                            }
                        }
                    } else if (workingHours > 0 && workingHours < HALF_DAY_HOURS) {
                        totalWorked += 0.25;
                    } else {
                        totalWorked += 1;
                    }
                }

                // Handle absent days
                if (item.status === 'absent') {
                    absentDateSet.add(item.date);
                    if (item.lossOfPay) {
                        lossOfPay += item.lossOfPay;
                    }
                }

                // Handle "Checked In" status (partial day)
                if (item.status === 'Checked In' && item.checkIn) {
                    totalWorked += 0.25;
                    presentDays += 0.25;
                    const workingHours = calculateWorkingHours(item.checkIn, item.checkOut || '18:30', item.date);
                    totalHoursWorked += workingHours;
                }

                // Handle empty status but with check-in/check-out (count as present)
                if (!item.status && item.checkIn && item.checkOut) {
                    const workingHours = calculateWorkingHours(item.checkIn, item.checkOut, item.date);
                    totalHoursWorked += workingHours;
                    presentDays += 1;

                    if (workingHours >= FULL_DAY_HOURS) {
                        totalWorked += 1;
                    } else if (workingHours >= HALF_DAY_HOURS) {
                        totalWorked += 0.5;
                    } else if (workingHours > 0) {
                        totalWorked += 0.25;
                    } else {
                        totalWorked += 1;
                    }
                }

                if (item.status === 'present' || item.status === 'presentLate') {
                    presentDays += 1;
                }
            });
        }

        // Calculate absent days for dates without any attendance record
        monthDates.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isPastDate = date < new Date();
            const isAfterJoining = !isBeforeDateOfJoining(dateStr);

            // Skip if date is before joining or future date
            if (!isAfterJoining || !isPastDate) return;

            const isSundayFlag = isSunday(date);
            const isHolidayDay = holidays.includes(dateStr);
            const isTuesday = getDay(date) === 2;
            const isTechOffDay = profile?.department === "tech" && isTuesday;

            // Only count as absent if it's a working day (not Sunday, holiday, or tech Tuesday off)
            if (!isSundayFlag && !isHolidayDay && !isTechOffDay) {
                // Check if this date has any attendance record
                const hasAttendance = profile?.attendance?.[monthName]?.some(item => item.date === dateStr);
                if (!hasAttendance && !absentDateSet.has(dateStr)) {
                    absentDateSet.add(dateStr);
                }
            }
        });

        // Set the final absent days count
        absentDays = absentDateSet.size;

        // Calculate loss of pay ONLY from cumulative late/early (every 3 = 1 loss of pay)
        // Remove loss of pay from absent days - absent days should not automatically cause loss of pay
        if (cumulativeLateEarly >= 3) {
            const additionalLoss = Math.floor(cumulativeLateEarly / 3);
            lossOfPay = additionalLoss; // Only count late/early penalties for loss of pay
        }

        return {
            totalWorked: parseFloat(totalWorked.toFixed(2)),
            totalWorkingDays: actualWorkingDays, // Use actual working days instead of displayWorkingDays
            totalCalendarDays,
            holidaysCount,
            sundaysCount,
            tuesdaysCount,
            presentLate,
            earlyOut,
            firstHalf,
            secondHalf,
            lossOfPay,
            totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
            paidLeaves: parseFloat(paidLeaves.toFixed(2)),
            absentDays,
            presentDays: Math.round(presentDays)
        };
    };

    // Update the attendance calculation to use currentMonth
    const {
        totalWorked,
        totalWorkingDays,
        totalCalendarDays,
        holidaysCount,
        sundaysCount,
        tuesdaysCount,
        presentLate,
        earlyOut,
        firstHalf,
        secondHalf,
        lossOfPay,
        totalHoursWorked,
        paidLeaves,
        absentDays,
        presentDays
    } = calculateAttendanceByMonthIndex(profile, currentMonth, 2025);

    // Check if it's the last day of the current month
    const isMonthEnd = isLastDayOfMonth(new Date());

    // Check if current month is before date of joining
    const isMonthBeforeJoining = useMemo(() => {
        if (!profile?.dateOfJoining) return false;
        const doj = new Date(profile.dateOfJoining);
        const currentMonthStart = startOfMonth(new Date(2025, currentMonth, 1));
        const currentMonthEnd = endOfMonth(currentMonthStart);
        return isBefore(currentMonthEnd, doj);
    }, [profile?.dateOfJoining, currentMonth]);

    // Check if current month is the current actual month
    const isCurrentMonth = useMemo(() => {
        const today = new Date();
        return currentMonth === today.getMonth() && today.getFullYear() === 2025;
    }, [currentMonth]);

    // Get previous month data for display
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? 2024 : 2025;

    const {
        absentDays: prevAbsentDays,
        presentDays: prevPresentDays,
        lossOfPay: prevLossOfPay,
        totalCalendarDays: prevTotalCalendarDays,
        holidaysCount: prevHolidaysCount,
        sundaysCount: prevSundaysCount,
        tuesdaysCount: prevTuesdaysCount,
        totalWorkingDays: prevTotalWorkingDays
    } = calculateAttendanceByMonthIndex(profile, previousMonth, previousYear);

    // Withdraw leave service
    const withdrawLeaveService = async (employeeId, startDate, endDate) => {
        const res = await fetch(`/api/ar?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`, { method: 'DELETE' });
        return res;
    };

    const handleWithdraw = async (employeeId, startDate, endDate, leaveDates) => {
        try {
            setLoadingLeave(startDate);

            const res = await withdrawLeaveService(employeeId, startDate, endDate);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to withdraw leave');
            }

            // Local UI update
            const monthKeys = Object.keys(profile.attendance);
            monthKeys.forEach((month) => {
                profile.attendance[month] = profile.attendance[month].filter(
                    (l) => !leaveDates.includes(l.date)
                );
            });

            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "success",
                    title: `Success`,
                    message: `Leave withdrawn successfully`,
                },
            }));

            mutated();
        } catch (err) {
            console.log("Withdraw failed:", err);
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

    // Filter leaves dynamically for the month
    const monthLeaves = useMemo(() => {
        if (!profile || !profile.attendance) return [];
        const monthNamee = monthNames[currentMonth];
        const monthArr = profile.attendance[monthNamee] || [];

        // Filter pending leaves with leaveType and check date of joining
        const pendingLeaves = monthArr.filter(
            (item) => item.status === "pending" && item.leaveType && !isBeforeDateOfJoining(item.date)
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
    }, [profile, currentMonth]);

    // --- Updated: submit AR request via Mongo API ---
    const submitAR = async ({ dateFrom, dateTo, checkIn, checkOut, reason }) => {
        if (!profile?._id) return;

        try {
            setArSubmitting(true);
            setServiceCall(true);

            // Check if any date is before date of joining
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            if (isBeforeDateOfJoining(dateFrom) || isBeforeDateOfJoining(dateTo)) {
                throw new Error('Cannot apply AR for dates before your date of joining.');
            }

            const payload = {
                employeeId: profile._id,
                dateFrom,
                dateTo,
                checkIn,
                checkOut,
                reason,
                type: 'regularization',
            };

            const res = await fetch('/api/ar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to apply regularization.');

            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Attendance Regularization submitted successfully.'
                },
            }));

            // Refresh data
            mutated();
            setShowARModal(false);

        } catch (err) {
            console.log('AR submit error:', err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Failed to submit attendance regularization.'
                },
            }));
        } finally {
            setServiceCall(false);
            setArSubmitting(false);
        }
    };

    // Withdraw AR
    const withdrawAR = async (employeeId, startDate, endDate, arDates = []) => {
        if (!employeeId || !startDate || !endDate) return;

        try {
            setServiceCall(true);

            const res = await fetch(
                `/api/ar?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
                { method: 'DELETE' }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to withdraw regularization.');

            setRootContext((prev) => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: 'success',
                    title: 'Withdrawn',
                    message: 'Regularization withdrawn successfully.',
                },
            }));

            mutated();
        } catch (err) {
            console.log('Withdraw AR error:', err);
            setRootContext((prev) => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: 'error',
                    title: 'Error',
                    message: err.message,
                },
            }));
        } finally {
            setServiceCall(false);
        }
    };

    // Yesterday UI block
    const YesterdayBlock = (() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Check if yesterday is before date of joining
        if (isBeforeDateOfJoining(yesterdayStr)) {
            return (
                <div className="bg-gray-100 text-center py-2 rounded-xl mb-3">
                    <p className="text-sm text-gray-600 italic">No data available for dates before joining.</p>
                </div>
            );
        }

        const monthNameNow = monthNames[yesterday.getMonth()];
        const yesterdayData =
            profile.attendance?.[monthNameNow]?.find(
                (d) => d.date === yesterdayStr
            ) || null;

        if (!yesterdayData) {
            return (
                <div className="bg-gray-100 text-center py-2 rounded-xl mb-3">
                    <p className="text-sm text-gray-600 italic">No attendance record for yesterday.</p>
                </div>
            );
        }

        const checkIn = yesterdayData.checkIn || "—";
        const checkOut = yesterdayData.checkOut || "—";
        let totalHours = "—";

        if (checkIn && checkOut) {
            const checkInTime = parse(checkIn, "HH:mm", new Date());
            const checkOutTime = parse(checkOut, "HH:mm", new Date());
            const minutesWorked = differenceInMinutes(checkOutTime, checkInTime);

            const hours = Math.floor(minutesWorked / 60);
            const minutes = minutesWorked % 60;

            totalHours = `${hours || 0} hrs ${minutes || 0} mins`;
        }

        return (
            <div className="bg-blue-50 p-3 rounded-sm mb-3 border border-blue-200">
                <p className="text-md text-center font-bold text-gray-700 mb-1">Yesterday's Attendance</p>
                <p className='text-sm'>Check-in: <strong>{checkIn}</strong></p>
                <p className='text-sm'>Check-out: <strong>{checkOut}</strong></p>
                <p className="text-sm mt-1 text-gray-700">Total Worked: <span className="font-bold text-blue-700">{totalHours}</span></p>
            </div>
        );
    })();

    return (
        <div className="flex flex-col md:flex-row w-full text-gray-700 gap-4">
            {serviceCall && <Loading />}

            {/* Left Calendar Section */}
           <div className="w-full bg-white shadow-lg">
             <Calendar
                profile={profile}
                onCheckIn={onCheckIn}
                onCheckOut={onCheckOut}
                isCheckedIn={isCheckedIn}
                onGoToCalendar={() => setShowCalendar(true)}
                setMonthName={handleMonthChange}
                onRequestAR={(dateStr) => {
                    if (isBeforeDateOfJoining(dateStr)) {
                        setRootContext(prev => ({
                            ...prev,
                            toast: {
                                show: true,
                                dismiss: true,
                                type: 'error',
                                title: 'Error',
                                message: 'Cannot apply AR for dates before your date of joining.'
                            },
                        }));
                        return;
                    }
                    setShowARModal(true);
                }}
            />
           </div>

            {/* Right Side: Summary & Leaves Section */}
            <aside className="w-full bg-white shadow-lg rounded-xl sm:p-4 flex flex-col">
                {/* Month Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {isCurrentMonth ? `${monthNames[currentMonth]} (In Progress)` : `${monthNames[currentMonth]} Summary`}
                    </h3>
                    {!isMonthBeforeJoining && isCurrentMonth && (
                        <button
                            onClick={() => setShowARModal(true)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Apply AR
                        </button>
                    )}
                </div>

                {isMonthBeforeJoining ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center p-1">
                            <div className="text-4xl mb-2">📅</div>
                            <p className="text-gray-500 text-sm">
                                No data available before {profile?.dateOfJoining ? format(new Date(profile.dateOfJoining), 'MMM dd, yyyy') : 'date of joining'}
                            </p>
                        </div>
                    </div>
                ) : isCurrentMonth ? (
                    // Current Month - Show "Month in Progress" message
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                            <div className="text-4xl mb-3">📊</div>
                            <h4 className="text-lg font-semibold text-blue-700 mb-2">Month in Progress</h4>
                            <p className="text-sm text-gray-600">
                                Attendance summary will be available after the month ends.
                            </p>
                        </div>

                        {/* Yesterday block for current month */}
                        {YesterdayBlock}

                        {/* Pending Requests for current month */}
                        <h4 className="mt-2 mb-2 font-medium w-full">Pending Requests</h4>
                        <div className="overflow-y-auto max-h-56 space-y-2 w-full">
                            {/* Pending Leaves */}
                            {monthLeaves.length === 0 ? (
                                <p className="text-gray-400 italic text-sm">No pending leaves.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {monthLeaves.map((leave, index) => (
                                        <li key={index} className="flex justify-between items-center p-2 border border-gray-200 rounded-md">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-600 capitalize">{leave.leaveType}</div>
                                                <div className="text-xs text-gray-500">{formatDateTime(leave.startDate, 'DD-MM-YYYY')}{leave.startDate !== leave.endDate ? ` to ${formatDateTime(leave.endDate, 'DD-MM-YYYY')}` : ''}</div>
                                            </div>
                                            {leave.status !== 'approved' && leave.status !== 'rejected' && (
                                                <button
                                                    disabled={loadingLeave === leave.startDate}
                                                    onClick={() => handleWithdraw(
                                                        profile._id,
                                                        leave.startDate,
                                                        leave.endDate,
                                                        eachDayOfInterval({
                                                            start: parseISO(leave.startDate),
                                                            end: parseISO(leave.endDate)
                                                        }).map(d => format(d, 'yyyy-MM-dd'))
                                                    )}
                                                    className={`px-2 py-1 text-xs rounded-md font-medium text-white ${loadingLeave === leave.startDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                                                        }`}
                                                >
                                                    {loadingLeave === leave.startDate ? 'Withdrawing...' : 'Withdraw'}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Pending Regularizations */}
                            {(() => {
                                const pendingAR = [];
                                Object.keys(profile.attendance || {}).forEach(m => {
                                    (profile.attendance[m] || []).forEach(it => {
                                        if (it.status === 'pendingRegularization' && !isBeforeDateOfJoining(it.date)) {
                                            pendingAR.push(it);
                                        }
                                    });
                                });

                                if (pendingAR.length === 0) return null;

                                return (
                                    <div className="w-full">
                                        <h5 className="text-sm font-medium mt-4 mb-2">Pending Regularizations</h5>
                                        <ul className="space-y-2">
                                            {pendingAR.map((ar, idx) => (
                                                <li key={idx} className="flex justify-between items-center p-2 border rounded border-gray-200">
                                                    <div className="text-sm">
                                                        <div className="font-medium">{formatDateTime(ar.date, 'DD-MM-YYYY')}</div>
                                                        <div className="text-xs text-gray-500">{ar.checkIn || '—'} - {ar.checkOut || '—'}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => withdrawAR(profile._id, ar.date, ar.date, [ar.date])}
                                                        className="px-2 py-1 rounded text-white bg-red-600 text-xs hover:bg-red-700"
                                                    >
                                                        Withdraw
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    // Previous Month - Show Full Summary
                    <>
                        {/* Simplified Summary Section - Only Present, Absent, and Loss of Pay */}
                        <div className="space-y-3 mb-4">
                            {/* Present Days Counter */}
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-gray-700">Total Present Days</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {presentDays}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Includes full days, half days, and approved leaves
                                </p>
                            </div>

                            {/* Absent Days Counter */}
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <p className="text-sm font-medium text-gray-700">Total Absent Days</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {absentDays}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Days marked as absent
                                </p>
                            </div>

                            {/* Loss of Pay */}
                            {lossOfPay > 0 && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <p className="text-sm font-medium text-gray-700">Loss of Pay</p>
                                    <p className="text-lg font-bold text-orange-700">
                                        {lossOfPay} days
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        From late/early penalties (every 3 = 1 day)
                                    </p>
                                </div>
                            )}

                            {/* Total Working Days Info */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700">Month Overview</p>
                                <div className="text-xs text-gray-600 mt-1 space-y-1">
                                    <p>• Total Days: {totalCalendarDays}</p>
                                    <p>• Working Days: {totalWorkingDays}</p>
                                    <p>• Holidays: {holidaysCount}</p>
                                    <p>• Sundays: {sundaysCount}</p>
                                    {profile?.department === "tech" && (
                                        <p>• Tuesdays Off: {tuesdaysCount}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Yesterday block */}
                        {YesterdayBlock}

                        {/* Leaves & Pending ARs */}
                        <h4 className="mt-2 mb-2 font-medium">Pending Requests</h4>
                        <div className="overflow-y-auto max-h-56 space-y-2">
                            {/* Pending Leaves */}
                            {monthLeaves.length === 0 ? (
                                <p className="text-gray-400 italic text-sm">No pending leaves.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {monthLeaves.map((leave, index) => (
                                        <li key={index} className="flex justify-between items-center p-2 border border-gray-200 rounded-md">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-600 capitalize">{leave.leaveType}</div>
                                                <div className="text-xs text-gray-500">{formatDateTime(leave.startDate, 'DD-MM-YYYY')}{leave.startDate !== leave.endDate ? ` to ${formatDateTime(leave.endDate, 'DD-MM-YYYY')}` : ''}</div>
                                            </div>
                                            {leave.status !== 'approved' && leave.status !== 'rejected' && (
                                                <button
                                                    disabled={loadingLeave === leave.startDate}
                                                    onClick={() => handleWithdraw(
                                                        profile._id,
                                                        leave.startDate,
                                                        leave.endDate,
                                                        eachDayOfInterval({
                                                            start: parseISO(leave.startDate),
                                                            end: parseISO(leave.endDate)
                                                        }).map(d => format(d, 'yyyy-MM-dd'))
                                                    )}
                                                    className={`px-2 py-1 text-xs rounded-md font-medium text-white ${loadingLeave === leave.startDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                                                        }`}
                                                >
                                                    {loadingLeave === leave.startDate ? 'Withdrawing...' : 'Withdraw'}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Pending Regularizations */}
                            {(() => {
                                const pendingAR = [];
                                Object.keys(profile.attendance || {}).forEach(m => {
                                    (profile.attendance[m] || []).forEach(it => {
                                        if (it.status === 'pendingRegularization' && !isBeforeDateOfJoining(it.date)) {
                                            pendingAR.push(it);
                                        }
                                    });
                                });

                                if (pendingAR.length === 0) return null;

                                return (
                                    <div>
                                        <h5 className="text-sm font-medium mt-4 mb-2">Pending Regularizations</h5>
                                        <ul className="space-y-2">
                                            {pendingAR.map((ar, idx) => (
                                                <li key={idx} className="flex justify-between items-center p-2 border rounded border-gray-200">
                                                    <div className="text-sm">
                                                        <div className="font-medium">{formatDateTime(ar.date, 'DD-MM-YYYY')}</div>
                                                        <div className="text-xs text-gray-500">{ar.checkIn || '—'} - {ar.checkOut || '—'}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => withdrawAR(profile._id, ar.date, ar.date, [ar.date])}
                                                        className="px-2 py-1 rounded text-white bg-red-600 text-xs hover:bg-red-700"
                                                    >
                                                        Withdraw
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                )}
            </aside>

            <CalendarModal profile={profile} mutated={mutated} attendance={profile.attendance} employeeEvents={profile.events} showCalendar={showCalendar} setShowCalendar={setShowCalendar} />

            {/* AR Modal */}
            {showARModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <ARForm
                        defaultDate={new Date().toISOString().slice(0, 10)}
                        onClose={() => setShowARModal(false)}
                        onSubmit={submitAR}
                        submitting={arSubmitting}
                    />
                </div>
            )}
        </div>
    );
}