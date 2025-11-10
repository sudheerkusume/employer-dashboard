'use client';
import React, { useState, useMemo, Fragment, useContext, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear, isSunday,
    set, getDay, isSameMonth,
    differenceInMinutes
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Mutated } from '../config/useswrfetch';
import Loading from '../common/loading';
import RootContext from '../config/rootcontext';
import ComboBox from '../common/form/combobox';

const categoryColors = {
    present: "#A8DCAB",
    firstHalf: "#A8DCAB",
    secondHalf: "#A8DCAB",
    halfDay: "#A8DCAB",
    absent: "#ff6a6a",
    "Checked In": "#2563eb",
    leaveApproved: "#e8d15dff",
    holiday: "#CBC3E3",
    sunday: "#d5d7d9ff",
    today: "#48a84dff",
};

// Helper: Check if current time is before 9 AM
const isBefore9AM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < 9;
};

// Helper: Check if it's Tuesday (off day)
const isOffDay = (date) => {
    const day = getDay(date); // Sunday=0, Monday=1, ..., Saturday=6
    return day === 2; // Tuesday (2) is off day
};

// Helper: Check if it's Sunday (holiday)
const isSundayHoliday = (date) => {
    return getDay(date) === 0; // Sunday (0) is holiday
};

// Helper: Check if date is holiday (you can customize this with your holiday list)
const isHoliday = (date) => {
    const holidayList = [
        '2025-01-01',
        '2025-01-26',
        '2025-03-25',
        '2025-08-15',
        '2025-10-02',
        '2025-10-18',
        '2025-10-20',
        '2025-11-20',
        '2025-12-25',
    ];
    return holidayList.includes(format(date, 'yyyy-MM-dd'));
};

// Helper: Calculate working hours in decimal
const calculateWorkingHours = (checkIn, checkOut, date) => {
    if (!checkIn || !checkOut) return 0;

    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const start = inH * 60 + inM;
    const end = outH * 60 + outM;

    let diffMinutes = Math.max(0, end - start);

    // Adjust for lunch break based on day
    const day = getDay(new Date(date));
    if (day !== 6) { // Not Saturday
        // Subtract 1 hour lunch break for normal days
        diffMinutes = Math.max(0, diffMinutes - 60);
    } else {
        // Saturday: Subtract 30 minutes lunch break
        diffMinutes = Math.max(0, diffMinutes - 30);
    }

    return diffMinutes / 60; // hours as decimal
};

// Helper: Determine status based on your rules
const determineStatus = (checkIn, checkOut, leaveType, leaveStatus, date, workingHoursStr) => {
    // Check if it's Sunday (holiday) - return 'sunday' for Sundays
    if (date && isSundayHoliday(new Date(date))) {
        return 'sunday'; // Changed from 'holiday' to 'sunday'
    }

    const today = new Date();
    const currentDate = date ? new Date(date) : null;
    const isFutureDate = currentDate && currentDate > today;

    // Extract numeric working hours from string like "9.03 hrs" or "8.50"
    const getNumericWorkingHours = (hoursStr) => {
        if (!hoursStr) return 0;
        // Remove "hrs" and any non-numeric characters except decimal point
        const numericStr = hoursStr.toString().replace('hrs', '').trim();
        return parseFloat(numericStr) || 0;
    };

    const workingHours = getNumericWorkingHours(workingHoursStr);

    // Handle approved leaves first - check both leaveStatus and status fields
    if (leaveStatus === 'approved' || leaveStatus === 'firstHalfApproved' || leaveStatus === 'secondHalfApproved') {
        if (leaveType === 'full' || leaveType === 'casual') {
            return 'leaveApproved'; // Full day leave
        }

        if (leaveType === 'first half' || leaveStatus === 'firstHalfApproved') {
            // For future dates with first half approved, just show the leave without absent/present
            if (isFutureDate) {
                return 'firstHalfApproved'; // Just show first half leave for future dates
            }
            // First half approved - check if second half is present based on working hours
            if (workingHours >= 4) {
                return 'firstHalfApproved_present'; // First half leave (yellow), second half present (green)
            } else {
                return 'firstHalfApproved_absent'; // First half leave (yellow), second half absent (red)
            }
        }

        if (leaveType === 'second half' || leaveStatus === 'secondHalfApproved') {
            // For future dates with second half approved, just show the leave without absent/present
            if (isFutureDate) {
                return 'secondHalfApproved'; // Just show second half leave for future dates
            }
            // Second half approved - check if first half is present based on working hours
            if (workingHours >= 4) {
                return 'secondHalfApproved_present'; // Second half leave (yellow), first half present (green)
            } else {
                return 'secondHalfApproved_absent'; // Second half leave (yellow), first half absent (red)
            }
        }
    }

    // Handle present status (including presentLate)
    if ((workingHours >= 8.45 || leaveStatus === 'present') || leaveStatus === 'presentLate') {
        return 'present';
    }

    // If no status but working hours are 8.45+ and check-in/check-out exist, mark as present
    if ((!leaveStatus || leaveStatus === 'Checked In') && checkIn && checkOut && workingHours >= 8.45) {
        return 'present';
    }

    // Condition: no check-in and check-out times
    if (!checkIn && !checkOut) {
        // For future dates without data, return null to show transparent
        if (isFutureDate) {
            return null;
        }
        return 'absent';
    }

    // Condition: present with 8+ working hours
    if (workingHours >= 8.45) {
        return 'present';
    }

    // Handle half days based on working hours
    if (workingHours >= 4) {
        // Determine which half based on check-in time
        if (checkIn) {
            const checkInTime = checkIn.split(':').map(Number);
            const checkInHour = checkInTime[0] + (checkInTime[1] / 60);

            if (checkInHour <= 12.0) { // Check-in before 12:00 = first half
                return 'firstHalfp';
            } else { // Check-in after 12:00 = second half
                return 'secondhalfp';
            }
        }
    }

    // Default case - for future dates return null, for past dates return absent
    return isFutureDate ? null : 'absent';
};

// Split Circle Component for visual indicators
const SplitCircle = ({ status, isToday, size = 40, isLegend = false }) => {
    const radius = size / 2;
    const center = radius;
    const getColors = () => {
        switch (status) {
            case 'present':
                return { left: categoryColors.present, right: categoryColors.present };
            case 'firstHalfp':
                return { left: categoryColors.firstHalf, right: categoryColors.absent };
            case 'secondhalfp':
                return { left: categoryColors.absent, right: categoryColors.secondHalf };
            case 'firstHalfApproved':
                return { left: categoryColors.leaveApproved, right: 'transparent' };
            case 'secondHalfApproved':
                return { left: 'transparent', right: categoryColors.leaveApproved };
            case 'firstHalfApproved_present':
                return { left: categoryColors.leaveApproved, right: categoryColors.present };
            case 'firstHalfApproved_absent':
                return { left: categoryColors.leaveApproved, right: categoryColors.absent };
            case 'secondHalfApproved_present':
                return { left: categoryColors.present, right: categoryColors.leaveApproved };
            case 'secondHalfApproved_absent':
                return { left: categoryColors.absent, right: categoryColors.leaveApproved };
            case 'leaveApproved':
                return { left: categoryColors.leaveApproved, right: categoryColors.leaveApproved };
            case 'absent':
                return { left: categoryColors.absent, right: categoryColors.absent };
            case 'holiday':
                return { left: categoryColors.holiday, right: categoryColors.holiday };
            case 'sunday':
                return { left: categoryColors.sunday, right: categoryColors.sunday };
            case 'today':
                return { left: categoryColors.today, right: categoryColors.today };
            default:
                return isToday
                    ? { left: '#d1d5db', right: '#d1d5db' }
                    : { left: 'transparent', right: 'transparent' };
        }
    };

    const colors = getColors();
    const stroke = isToday && !status ? '#374151' : 'none';

    // Only firstHalfApproved and secondHalfApproved statuses get diagonal split
    const isDiagonalSplit = [
        'firstHalfApproved',
        'secondHalfApproved',
        'firstHalfApproved_present',
        'firstHalfApproved_absent',
        'secondHalfApproved_present',
        'secondHalfApproved_absent'
    ].includes(status);

    // All other statuses get vertical split
    const isVerticalSplit = !isDiagonalSplit && status;

    return (
        <svg width={size} height={size} className="cursor-pointer">
            {/* Background circle for today */}
            {isToday && (
                <circle
                    cx={center}
                    cy={center}
                    r={radius - 1}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="1"
                />
            )}

            {/* For legend, show full circle with left color */}
            {isLegend ? (
                <circle
                    cx={center}
                    cy={center}
                    r={radius - 1}
                    fill={colors.left}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                />
            ) : (
                <>
                    {/* Clip path for rounded circle */}
                    <defs>
                        <clipPath id="circleClip">
                            <circle cx={center} cy={center} r={radius} />
                        </clipPath>
                    </defs>

                    <g clipPath="url(#circleClip)">
                        {isDiagonalSplit ? (
                            // Diagonal split ONLY for approved half leaves
                            <>
                                {/* Top-left to bottom-right diagonal - First half */}
                                <path
                                    d={`M 0 0 L ${size} ${size} L 0 ${size} Z`}
                                    fill={colors.left}
                                />
                                {/* Top-left to bottom-right diagonal - Second half */}
                                <path
                                    d={`M 0 0 L ${size} 0 L ${size} ${size} Z`}
                                    fill={colors.right}
                                />
                            </>
                        ) : isVerticalSplit ? (
                            // Vertical split for ALL other statuses
                            <>
                                {/* Left semicircle */}
                                <path
                                    d={`M ${center} ${center} L ${center} 0 A ${radius} ${radius} 0 0 0 ${center} ${size} Z`}
                                    fill={colors.left}
                                />
                                {/* Right semicircle */}
                                <path
                                    d={`M ${center} ${center} L ${center} ${size} A ${radius} ${radius} 0 0 0 ${center} 0 Z`}
                                    fill={colors.right}
                                />
                            </>
                        ) : (
                            // Default transparent for future dates without data
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="transparent"
                            />
                        )}
                    </g>

                    {/* Optional: Add border stroke for the circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                    />
                </>
            )}
        </svg>
    );
};

export default function Calendar({ profile, onGoToCalendar, onCheckIn, onCheckOut, isCheckedIn, setMonthName }) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
    const [selectedYear, setSelectedYear] = useState(getYear(today));
    const [selectedDate, setSelectedDate] = useState(null);
    const [popupData, setPopupData] = useState(null);
    const { setRootContext } = useContext(RootContext)
    // Leave modal states
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [isSelectingLeave, setIsSelectingLeave] = useState(false);
    const [leaveRange, setLeaveRange] = useState({
        start: null,
        end: null,
        leaveType: '',
        reason: ''
    });


    const updateCalendarDate = (month, year) => {
        const effectiveYear = isNaN(year) ? getYear(today) : year;
        const newDate = setMonth(setYear(new Date(), effectiveYear), month);
        setCurrentDate(newDate);
    };

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value);
        setSelectedMonth(newMonth);
        updateCalendarDate(newMonth, selectedYear);
        setMonthName(newMonth)
    };

    const handleYearChange = (e) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setSelectedYear('');
            updateCalendarDate(selectedMonth, getYear(today));
        } else {
            const newYear = parseInt(inputValue);
            if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
                setSelectedYear(newYear);
                updateCalendarDate(selectedMonth, newYear);
            }
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const [serviceCall, setServiceCall] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const attendanceMap = useMemo(() => {
        const map = {};
        if (!profile?.attendance) return map;

        const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;

        // Map existing attendance - ONLY for current month
        const currentMonthName = format(currentDate, 'MMMM');
        if (profile.attendance[currentMonthName]) {
            profile.attendance[currentMonthName].forEach(att => {
                // Only process dates that belong to the current month
                const attDate = new Date(att.date);
                if (getMonth(attDate) === getMonth(currentDate) && getYear(attDate) === getYear(currentDate)) {
                    let workingHours = calculateWorkingHours(att.checkIn, att.checkOut, att.date);

                    let status = determineStatus(
                        att.checkIn,
                        att.checkOut,
                        att.leaveType,
                        att.status,
                        att.date,
                        att.workingHours
                    );

                    if (att.leaveType && att.status === "pending") {
                        status = "leaveApplied";
                    }

                    map[att.date] = {
                        ...att,
                        workingHours: Number(workingHours) || 0,
                        status,
                    };
                }
            });
        }

        // Mark only PAST dates AFTER joining - ONLY for current month
        allDays.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isPastDate = day < today;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isAfterJoining = dateOfJoining ? day >= dateOfJoining : true;

            if (!isAfterJoining || !isCurrentMonth) return; // ❌ Do not mark anything before joining or outside current month

            const isSunday = isSundayHoliday(day);
            const isTuesday = getDay(day) === 2;
            const isHolidayDay = isHoliday(day);
            const isTuesdayOff = profile?.department === "tech" && isTuesday;

            if (isPastDate && !map[dayStr]) {
                if (isSunday) {
                    map[dayStr] = { status: 'sunday', workingHours: 0 };
                } else if (isTuesdayOff) {
                    map[dayStr] = { status: 'sunday', workingHours: 0 };
                } else if (isHolidayDay) {
                    map[dayStr] = { status: 'holiday', workingHours: 0 };
                } else {
                    map[dayStr] = { status: 'absent', workingHours: 0 };
                }
            }
        });

        return map;
    }, [profile, currentDate, allDays]);


    const handleOpenLeaveModal = () => {
        setLeaveModalOpen(true);
        setIsSelectingLeave(true);
        setLeaveRange({
            start: null,
            end: null,
            leaveType: '',
            reason: ''
        });
    };

    const handleCloseLeaveModal = () => {
        setLeaveModalOpen(false);
        setIsSelectingLeave(false);
        setLeaveRange({
            start: null,
            end: null,
            leaveType: '',
            reason: ''
        });
    };

    const user_details =
        typeof window !== "undefined" &&
        JSON.parse(localStorage.getItem("user_details"));
    const employeeId = user_details?.userId;

    const mutated = Mutated(employeeId ? `/api/employees?id=${employeeId}` : null)

    // Today's status checks
    const isTodaySunday = isSundayHoliday(today);
    const isTodayTuesdayOff = isOffDay(today) && profile?.department === "tech"; // Only tech gets Tuesday off
    const isTodayHoliday = isHoliday(today);

    // Determine if today has leave applied
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayAttendance = attendanceMap[todayStr];
    const isLeaveAppliedToday = todayAttendance && (
        todayAttendance.status === 'leaveApplied' ||
        todayAttendance.status === 'leaveApproved'
    );

    // Update disabled states - disable check-in/out on Sunday, Tuesday (only for tech), and holidays
    const isCheckInDisabled = isCheckedIn || isTodaySunday || isTodayTuesdayOff || isTodayHoliday || isBefore9AM() || isLeaveAppliedToday;

    const hasWorkedEnough = useMemo(() => {
        if (!todayAttendance?.checkIn) return false;

        const [hours, minutes] = todayAttendance.checkIn.split(":").map(Number);
        const checkInTime = set(new Date(), { hours, minutes, seconds: 0, milliseconds: 0 });
        const diffMinutes = differenceInMinutes(currentTime, checkInTime);

        return diffMinutes >= 255; // 4.25 hours = 255 minutes
    }, [todayAttendance, currentTime]);

    // Final disable condition
    const isCheckOutDisabled =
        !isCheckedIn ||
        isTodaySunday ||
        isTodayTuesdayOff ||
        isTodayHoliday ||
        isLeaveAppliedToday ||
        !hasWorkedEnough;

    // Auto-refresh current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Helper function to check if dates contain Monday or Saturday
    const hasInvalidDays = (startDate, endDate) => {
        if (!startDate || !endDate) return false;

        const daysInRange = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return daysInRange.some(date => {
            const day = getDay(date);
            return day === 1 || day === 6; // Monday (1) or Saturday (6)
        });
    };

    // Calculate if apply button should be disabled
    const isApplyButtonDisabled =
        !leaveRange.start ||
        !leaveRange.end ||
        !leaveRange.leaveType ||
        hasInvalidDays(leaveRange.start, leaveRange.end) ||
        serviceCall;

    const applyLeave = async () => {
        // Step 1: Basic validations
        if (!leaveRange.start || !leaveRange.end || !leaveRange.leaveType) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "warning",
                    title: "Warning",
                    message: "Please fill all required fields before applying for leave.",
                },
            }));
            return;
        }

        // Step 2: Validate dates are not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only

        if (leaveRange.start < today || leaveRange.end < today) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Invalid Dates",
                    message: "Leave can only be applied for today and future dates.",
                },
            }));
            return;
        }

        // Step 3: Prevent leave on restricted days
        const daysInRange = eachDayOfInterval({
            start: leaveRange.start,
            end: leaveRange.end,
        });

        const invalidDays = daysInRange.filter(date => {
            const day = getDay(date); // Sunday=0, Monday=1, ..., Saturday=6

            // Common restrictions for all departments
            if (day === 1 || day === 6) { // Monday (1) or Saturday (6)
                return true;
            }

            // Additional restriction for tech department - no leave on Tuesday
            if (profile?.department === "tech" && day === 2) { // Tuesday (2)
                return true;
            }

            return false;
        });

        if (invalidDays.length > 0) {
            // Create appropriate error message based on department
            let errorMessage = '';
            let restrictedDays = [];

            if (profile?.department === "tech") {
                restrictedDays = invalidDays.map(d => {
                    const dayName = format(d, "EEE");
                    return `${format(d, "MMM dd")} (${dayName})`;
                }).join(", ");
                errorMessage = `Leave cannot be applied on Monday, Tuesday or Saturday. Please remove: ${restrictedDays}`;
            } else {
                restrictedDays = invalidDays.map(d => {
                    const dayName = format(d, "EEE");
                    return `${format(d, "MMM dd")} (${dayName})`;
                }).join(", ");
                errorMessage = `Leave cannot be applied on Monday or Saturday. Please remove: ${restrictedDays}`;
            }

            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Invalid Leave Dates",
                    message: errorMessage,
                },
            }));
            return; // ❌ Stop execution
        }

        // Step 4: Validate half-day leaves (first half/second half can only be single day)
        if ((leaveRange.leaveType === 'first half' || leaveRange.leaveType === 'second half') &&
            leaveRange.start.getTime() !== leaveRange.end.getTime()) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Invalid Leave Range",
                    message: "Half-day leaves (first half/second half) can only be applied for a single day.",
                },
            }));
            return;
        }

        // Step 5: Proceed to API call
        setServiceCall(true);
        try {
            const res = await fetch("/api/leave/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId,
                    startDate: format(leaveRange.start, "yyyy-MM-dd"),
                    endDate: format(leaveRange.end, "yyyy-MM-dd"),
                    leaveType: leaveRange.leaveType,
                    reason: leaveRange.reason || "",
                }),
            });

            setServiceCall(false);
            const data = await res.json();

            // Step 6: Show success or failure toast
            if (res.ok) {
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Success",
                        message: "Leave applied successfully!",
                    },
                }));
                handleCloseLeaveModal();
                mutated(); // refresh leave data
            } else {
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to apply leave.",
                    },
                }));
            }
        } catch (err) {
            console.error("Error applying leave:", err);
            setServiceCall(false);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "An unexpected error occurred while applying leave.",
                },
            }));
        }
    };

    // Add this helper function to check for invalid days
    const checkInvalidDays = (startDate, endDate) => {
        if (!startDate || !endDate) return { hasInvalidDays: false, invalidDays: [] };

        const daysInRange = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        const invalidDays = daysInRange.filter(date => {
            const day = getDay(date);

            // Common restrictions for all departments
            if (day === 1 || day === 6) {
                return true;
            }

            // Additional restriction for tech department
            if (profile?.department === "tech" && day === 2) {
                return true;
            }

            return false;
        });

        return { hasInvalidDays: invalidDays.length > 0, invalidDays };
    };

    // Update the date change handlers to show warnings in real-time
    const handleStartDateChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setLeaveRange(prev => ({
            ...prev,
            start: date
        }));

        // Check for invalid days when start date is selected
        if (date && leaveRange.end) {
            const { hasInvalidDays, invalidDays } = checkInvalidDays(date, leaveRange.end);
            if (hasInvalidDays) {
                const restrictedDays = invalidDays.map(d => format(d, "EEE, MMM dd")).join(", ");
                const message = profile?.department === "tech"
                    ? `Leave cannot be applied on Monday, Tuesday or Saturday. Invalid days: ${restrictedDays}`
                    : `Leave cannot be applied on Monday or Saturday. Invalid days: ${restrictedDays}`;

                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "warning",
                        title: "Invalid Dates Selected",
                        message: message,
                    },
                }));
            }
        }
    };

    const handleEndDateChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setLeaveRange(prev => ({
            ...prev,
            end: date
        }));

        // Check for invalid days when end date is selected
        if (date && leaveRange.start) {
            const { hasInvalidDays, invalidDays } = checkInvalidDays(leaveRange.start, date);
            if (hasInvalidDays) {
                const restrictedDays = invalidDays.map(d => format(d, "EEE, MMM dd")).join(", ");
                const message = profile?.department === "tech"
                    ? `Leave cannot be applied on Monday, Tuesday or Saturday. Invalid days: ${restrictedDays}`
                    : `Leave cannot be applied on Monday or Saturday. Invalid days: ${restrictedDays}`;

                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "warning",
                        title: "Invalid Dates Selected",
                        message: message,
                    },
                }));
            }
        }
    };

    return (
        <div className=" p-2 sm:p-4 space-y-3 relative bg-gray-50 border-r border-gray-200">
            {/* Check-in/Check-out Buttons */}
            {serviceCall && <Loading />}
            <div className="flex justify-between gap-2 mb-3">
                <button
                    onClick={onCheckIn}
                    disabled={isCheckInDisabled}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${isCheckInDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {isCheckedIn ? 'Already Checked In' :
                        isBefore9AM() ? 'Check In (After 9 AM)' :
                            isTodayTuesdayOff ? 'Check In (Tuesday Off)' :
                                isTodaySunday ? 'Check In (Sunday Holiday)' :
                                    isTodayHoliday ? 'Check In (Holiday)' : 'Check In'}
                </button>
                <button
                    onClick={onCheckOut}
                    disabled={isCheckOutDisabled}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${isCheckOutDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {isCheckOutDisabled ?
                        (isTodayTuesdayOff ? 'Check Out (Tuesday Off)' :
                            isTodaySunday ? 'Check Out (Sunday Holiday)' :
                                isTodayHoliday ? 'Check Out (Holiday)' : 'Check Out') : 'Check Out'}
                </button>
            </div>
            {/* Go to Calendar and Leave buttons */}
            <div className="flex justify-between gap-2 mb-3">
                <button
                    onClick={handleOpenLeaveModal}
                    className="px-2 py-1 cursor-pointer text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    Apply for Leave
                </button>
                <button
                    onClick={onGoToCalendar}
                    className="px-2 py-1 cursor-pointer text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Calendar
                </button>
            </div>

            <div className="flex justify-between items-center mt-2">
                <button
                    onClick={() => {
                        const newDate = subMonths(currentDate, 1);
                        setSelectedMonth(getMonth(newDate));
                        setSelectedYear(getYear(newDate));
                        setCurrentDate(newDate);
                        setMonthName(getMonth(newDate))
                    }}
                    className="rounded-md bg-gray-200 p-1"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>

                <div className="flex gap-1 items-center">
                    <select
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        className="appearance-none rounded-md p-0.5 text-sm hover:bg-gray-200"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{format(new Date(0, i), 'MMMM')}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={selectedYear}
                        onChange={handleYearChange}
                        min="1900"
                        max="2100"
                        className="w-16 text-center rounded-md p-0.5 text-sm hover:bg-gray-200"
                    />
                </div>

                <button
                    onClick={() => {
                        const newDate = addMonths(currentDate, 1);
                        setSelectedMonth(getMonth(newDate));
                        setSelectedYear(getYear(newDate));
                        setCurrentDate(newDate);
                        setMonthName(getMonth(newDate))
                    }}
                    className="rounded-md bg-gray-200 p-1"
                >
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mt-5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center">{day}</div>
                ))}
            </div>

            {/* Month navigation and grid */}

            <div className="grid grid-cols-7 gap-2 text-sm mt-2 text-center place-items-center">
                {allDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const att = attendanceMap[dayStr];
                    const isTodayDate = dayStr === format(today, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isFutureDate = day > today;

                    const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;
                    const isBeforeJoining = dateOfJoining ? day < dateOfJoining : false;

                    const isTuesday = getDay(day) === 2;
                    const isTechOffDay = profile?.department === "tech" && isTuesday;

                    let status = att?.status || null;

                    if (status === "presentLate") status = "present";

                    // Tuesday off only after joining and in current month
                    if (!isBeforeJoining && isCurrentMonth && isTechOffDay) {
                        status = "sunday";
                    }

                    // No marking before joining
                    if (isBeforeJoining) {
                        status = null;
                    } else if (!att && isCurrentMonth) {
                        const isSunday = isSundayHoliday(day);
                        const isHolidayDay = isHoliday(day);

                        if (isHolidayDay) status = "holiday";
                        else if (isSunday) status = "sunday";
                    }

                    // For future dates in current month, show appropriate status
                    if (!att && isFutureDate && isCurrentMonth && !isBeforeJoining) {
                        const isSunday = isSundayHoliday(day);
                        const isHolidayDay = isHoliday(day);

                        if (isSunday) status = "sunday";
                        else if (isHolidayDay) status = "holiday";
                        else status = null; // Future working days show as transparent
                    }

                    const isLeaveApplied = att?.status === "leaveApplied";
                    const isLeaveApproved = att?.status === "leaveApproved";

                    const dayTextColor = isBeforeJoining || !isCurrentMonth
                        ? "text-gray-300"
                        : isLeaveApplied
                            ? "text-gray-600"
                            : isLeaveApproved
                                ? "text-white"
                                : "text-gray-900";

                    const dayBgColor = isLeaveApproved ? "bg-[#e8d15dff] rounded-full" : "";

                    const offDayBgColor =
                        isBeforeJoining || !isCurrentMonth ? "" : isTechOffDay ? "bg-gray-100" : "";

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (isBeforeJoining || !isCurrentMonth) return;

                                setSelectedDate(day);
                                setPopupData(
                                    att || {
                                        status: status || "No data",
                                        checkIn: att?.checkIn || "-",
                                        checkOut: att?.checkOut || "-",
                                        workingHours: att?.workingHours || 0,
                                    }
                                );
                            }}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition 
                    ${dayBgColor} 
                    ${offDayBgColor} 
                    ${isBeforeJoining || !isCurrentMonth
                                    ? "cursor-not-allowed hover:ring-0"
                                    : "cursor-pointer hover:ring-2 hover:ring-gray-300"
                                }`}
                            title={
                                isBeforeJoining || !isCurrentMonth
                                    ? ""
                                    : isTodayDate
                                        ? att?.checkIn
                                            ? "Checked In"
                                            : status === "approved"
                                                ? "Leave Approved"
                                                : "Today"
                                        : status === "sunday"
                                            ? profile.department === "tech" && getDay(day) === 2
                                                ? "Off Day (Tuesday)"
                                                : "Sunday"
                                            : status === "holiday"
                                                ? "Holiday"
                                                : att
                                                    ? att.status
                                                    : isFutureDate
                                                        ? "Future Date"
                                                        : "No data"
                            }
                        >
                            {!isTodayDate &&
                                !isBeforeJoining &&
                                isCurrentMonth &&
                                status && <SplitCircle status={status} isToday={false} size={40} />}

                            <span
                                className={`absolute text-xs font-bold ${isTodayDate
                                    ? "text-[#48a84dff] font-bold"
                                    : dayTextColor
                                    }`}
                            >
                                {format(day, "d")}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <SplitCircle status="today" size={16} isLegend={true} />
                        <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="present" size={16} isLegend={true} />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="absent" size={16} isLegend={true} />
                        <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="leaveApproved" size={16} isLegend={true} />
                        <span>Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="holiday" size={16} isLegend={true} />
                        <span>Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="sunday" size={16} isLegend={true} />
                        <span>Off Day</span>
                    </div>
                </div>
            </div>

            {/* Headless UI Modal */}
            <Transition appear show={popupData !== null} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setPopupData(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">

                                    {/* Close Icon */}
                                    <button
                                        className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-gray-700"
                                        onClick={() => setPopupData(null)}
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>

                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {selectedDate ? format(selectedDate, 'PPP') : ''}
                                    </Dialog.Title>

                                    <div className="mt-4 space-y-1 text-gray-800 text-capitalize">
                                        <p><strong>Status:</strong> {
                                            popupData?.status === "secondHalf" ? "Second Half" :
                                                popupData?.status === "firstHalf" ? "First Half" :
                                                    popupData?.status === "sunday" ? "Off Day (Tuesday)" :
                                                        popupData?.status === "holiday" ? "Holiday" :
                                                            popupData?.status
                                        }</p>
                                        <p><strong>Check-in:</strong> {popupData?.checkIn}</p>
                                        <p><strong>Check-out:</strong> {popupData?.checkOut}</p>
                                        <p>
                                            <strong>Working Hours:</strong> {typeof popupData?.workingHours === 'number' ? popupData.workingHours.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Leave Modal */}
            <Transition appear show={leaveModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleCloseLeaveModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                                    <button
                                        className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-gray-700"
                                        onClick={handleCloseLeaveModal}
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Apply Leave
                                    </Dialog.Title>
                                    {serviceCall && <Loading />}
                                    <div className="mt-4 space-y-4 text-gray-800">
                                        {/* Info Message */}
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> Leave can only be applied for today ({format(today, 'MMM dd, yyyy')}) and future dates.
                                            </p>
                                        </div>

                                        {/* Date Input Fields */}
                                        <div className="space-y-3">
                                            <div>
                                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Start Date *
                                                </label>
                                                <input
                                                    id="startDate"
                                                    type="date"
                                                    value={leaveRange.start ? format(leaveRange.start, 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const date = e.target.value ? new Date(e.target.value) : null;
                                                        setLeaveRange(prev => ({
                                                            ...prev,
                                                            start: date,
                                                            end: date // Automatically set end date to match start date
                                                        }));
                                                    }}
                                                    min={format(today, 'yyyy-MM-dd')} // Disable past dates
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                    End Date *
                                                </label>
                                                <input
                                                    id="endDate"
                                                    type="date"
                                                    value={leaveRange.end ? format(leaveRange.end, 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const date = e.target.value ? new Date(e.target.value) : null;
                                                        setLeaveRange(prev => ({
                                                            ...prev,
                                                            end: date
                                                        }));
                                                    }}
                                                    min={leaveRange.start ? format(leaveRange.start, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd')}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            <ComboBox
                                                title={"Leave Type"}
                                                data={["casual", "earned", "sick", "emergency", "first half", "second half"]}
                                                required={true}
                                                value={leaveRange.leaveType || ''}
                                                onChange={(e) => setLeaveRange(prev => ({
                                                    ...prev,
                                                    leaveType: e
                                                }))}
                                            />
                                            {/* Reason Textarea */}
                                            <div>
                                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reason
                                                </label>
                                                <textarea
                                                    id="reason"
                                                    value={leaveRange.reason || ''}
                                                    onChange={(e) => setLeaveRange(prev => ({
                                                        ...prev,
                                                        reason: e.target.value
                                                    }))}
                                                    placeholder="Brief reason for leave (optional)"
                                                    rows={3}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    maxLength={500}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {leaveRange.reason ? leaveRange.reason.length : 0}/500 characters
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={applyLeave}
                                                disabled={isApplyButtonDisabled}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {serviceCall ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Applying...
                                                    </div>
                                                ) : (
                                                    'Submit Leave'
                                                )}
                                            </button>
                                            <button
                                                onClick={handleCloseLeaveModal}
                                                disabled={serviceCall}
                                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}