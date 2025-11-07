'use client';
import React, { useState, useMemo, Fragment, useContext, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear, isSunday,
    set, getDay,
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
    holiday: "#d5d7d9ff",
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
        '2025-10-02',
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
const determineStatus = (checkIn, checkOut, leaveType, leaveStatus, date) => {
    // Check if it's Sunday (holiday)
    if (date && isSundayHoliday(new Date(date))) {
        return 'holiday';
    }

    // Handle leave applications first
    if (leaveType === 'full' && leaveStatus === 'approved') return 'leaveApproved';
    if (leaveType === 'first half' && leaveStatus === 'approved') return 'firstHalfApproved';
    if (leaveType === 'second half' && leaveStatus === 'approved') return 'secondHalfApproved';
    if (leaveType && leaveStatus === 'pending') return 'leaveApplied';

    // If no check-in/check-out and no approved leave
    if (!checkIn || !checkOut) {
        if (leaveType === 'first half' && leaveStatus === 'approved') return 'firstHalfApproved';
        if (leaveType === 'second half' && leaveStatus === 'approved') return 'secondHalfApproved';
        return 'absent';
    }

    const toDecimal = (time) => {
        if (!time) return null;
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
    };

    const day = getDay(new Date(date));
    const checkInDec = toDecimal(checkIn);
    const checkOutDec = toDecimal(checkOut);

    // Saturday rules (6.5 hours)
    if (day === 6) { // Saturday
        const expectedCheckIn = 9.5; // 09:30
        const expectedCheckOut = 16.0; // 16:00
        const minWorkingHours = 5.5; // 5.5 hours net (6.5 gross - 0.5 lunch)

        const workingHours = calculateWorkingHours(checkIn, checkOut, date);

        // Check if within expected time range and worked enough hours
        if (checkInDec <= expectedCheckIn + 0.5 && // Allow 30 mins late
            checkOutDec >= expectedCheckOut - 0.5 && // Allow 30 mins early
            workingHours >= minWorkingHours) {
            return 'present';
        }

        // Handle half days for Saturday
        if (workingHours >= minWorkingHours / 2) {
            if (checkInDec <= 12.0) {
                return 'firstHalfp';
            } else {
                return 'secondhalfp';
            }
        }

        return 'absent';
    }

    // Normal days (Mon, Wed, Thu, Fri) - 9 hours
    if ([1, 3, 4, 5].includes(day)) { // Monday=1, Wednesday=3, Thursday=4, Friday=5
        const expectedCheckIn = 9.5; // 09:30
        const expectedCheckOut = 18.5; // 18:30
        const minWorkingHours = 8.0; // 8 hours net (9 gross - 1 lunch)

        const workingHours = calculateWorkingHours(checkIn, checkOut, date);

        // Check if within expected time range and worked enough hours
        if (checkInDec <= expectedCheckIn + 0.5 && // Allow 30 mins late
            checkOutDec >= expectedCheckOut - 0.5 && // Allow 30 mins early
            workingHours >= minWorkingHours) {
            return 'present';
        }

        // Handle half days for normal days
        const halfDayHours = 4.0; // 4 hours net
        if (workingHours >= halfDayHours) {
            // First half: Check-in before 12:00 and check-out around 14:00
            if (checkInDec <= 12.0 && checkOutDec >= 14.0) {
                if (leaveType === 'second half' && leaveStatus === 'approved') {
                    return 'secondHalfApproved_present';
                }
                return 'firstHalfp';
            }
            // Second half: Check-in around 13:00 and check-out after 15:00
            if (checkInDec >= 13.0 && checkOutDec >= 15.0) {
                if (leaveType === 'first half' && leaveStatus === 'approved') {
                    return 'firstHalfApproved_present';
                }
                return 'secondhalfp';
            }

            // Default half day assignment based on check-in time
            if (checkInDec <= 12.0) {
                return 'firstHalfp';
            } else {
                return 'secondhalfp';
            }
        }

        return 'absent';
    }

    return 'absent';
};

// Split Circle Component for visual indicators
const SplitCircle = ({ status, isToday, size = 40, isLegend = false }) => {
    const radius = size / 2;
    const center = radius;
    const getColors = () => {
        switch (status) {
            case 'present':
                return { left: categoryColors.present, right: categoryColors.present };
            case 'firsthalfa':
                return { left: categoryColors.leaveApproved, right: categoryColors.absent };
            case 'secondhalfa':
                return { left: categoryColors.absent, right: categoryColors.leaveApproved };
            case 'firstHalfp':
                return { left: categoryColors.firstHalf, right: categoryColors.absent };
            case 'secondhalfp':
                return { left: categoryColors.present, right: categoryColors.leaveApproved };
            case 'firstHalf':
                return { left: categoryColors.firstHalf, right: categoryColors.present };
            case 'secondHalf':
                return { left: categoryColors.absent, right: categoryColors.secondHalf };
            // New statuses for approved half days
            case 'firstHalfApproved_present':
                return { left: categoryColors.leaveApproved, right: categoryColors.present };
            case 'firstHalfApproved_absent':
                return { left: categoryColors.leaveApproved, right: categoryColors.absent };
            case 'secondHalfApproved_present':
                return { left: categoryColors.present, right: categoryColors.leaveApproved };
            case 'secondHalfApproved_absent':
                return { left: categoryColors.absent, right: categoryColors.leaveApproved };
            case 'absent':
                return { left: categoryColors.absent, right: categoryColors.absent };
            case 'leaveApproved':
                return { left: categoryColors[status], right: categoryColors[status] };
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

    // Check if it's an approved half-day status that needs diagonal split
    const isDiagonalSplit = [
        'firstHalfApproved_present',
        'firstHalfApproved_absent',
        'secondHalfApproved_present',
        'secondHalfApproved_absent'
    ].includes(status);

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
                            // Rounded diagonal split for approved half days
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
                        ) : (
                            // Vertical split for other statuses
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

        // Get date of joining from profile
        const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;

        // Map existing attendance
        Object.keys(profile.attendance).forEach(monthName => {
            profile.attendance[monthName].forEach(att => {
                let workingHours = calculateWorkingHours(att.checkIn, att.checkOut, att.date);
                let status = determineStatus(att.checkIn, att.checkOut, att.leaveType, att.status, att.date);

                // Handle leave applied status
                if (att.leaveType && att.status === "pending") {
                    status = "leaveApplied";
                }

                map[att.date] = {
                    ...att,
                    workingHours: Number(workingHours) || 0,
                    status,
                };
            });
        });

        // Only mark absent for past dates in the current month that are after date of joining
        const todayStr = format(today, 'yyyy-MM-dd');
        allDays.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isPastOrToday = day <= today;
            const isCurrentMonth = getMonth(day) === getMonth(currentDate);
            const isAfterJoining = dateOfJoining ? day >= dateOfJoining : true;

            const isSunday = isSundayHoliday(day);
            const isTuesday = getDay(day) === 2; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
            const isCustomHoliday = isHoliday(day);

            // ✅ ONLY tech department gets Tuesday off
            const isTuesdayOff = profile?.department === "tech" && isTuesday;

            if (isPastOrToday && isCurrentMonth && !map[dayStr] && isAfterJoining) {
                if (isSunday) {
                    map[dayStr] = { status: 'holiday', workingHours: 0 };
                } else if (isTuesdayOff) {
                    // Only mark as off day if department is tech AND no attendance exists
                    map[dayStr] = { status: 'sunday', workingHours: 0 };
                } else if (isCustomHoliday) {
                    map[dayStr] = { status: 'holiday', workingHours: 0 };
                } else {
                    // For non-tech departments on Tuesday, mark as absent if no attendance
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

        // Step 2: Prevent leave on Monday or Saturday
        const daysInRange = eachDayOfInterval({
            start: leaveRange.start,
            end: leaveRange.end,
        });

        const invalidDays = daysInRange.filter(date => {
            const day = getDay(date); // Sunday=0, Monday=1, ..., Saturday=6
            return day === 1 || day === 6; // Block Monday (1) and Saturday (6)
        });

        if (invalidDays.length > 0) {
            const invalidFormatted = invalidDays.map(d => format(d, "EEE, MMM dd")).join(", ");
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Invalid Leave Dates",
                    message: `Leave cannot be applied on Monday or Saturday. Please remove: ${invalidFormatted}`,
                },
            }));
            return; // ❌ Stop execution
        }

        // Step 3: Proceed to API call
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

            // Step 4: Show success or failure toast
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
                    const isTodayDate = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    const isCurrentMonth = getMonth(day) === getMonth(currentDate);

                    const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;
                    const isBeforeJoining = dateOfJoining ? day < dateOfJoining : false;

                    // ✅ ALWAYS use status from attendanceMap - never override existing records
                    let status = att?.status || null;

                    // Map your status to our system
                    if (status === 'present' || status === 'presentLate') {
                        status = 'present';
                    }
                    // 'Checked In', 'absent', etc. remain as they are

                    // Only apply special statuses if there's NO existing attendance record
                    if (!att && isCurrentMonth && !isBeforeJoining) {
                        const isSunday = isSundayHoliday(day);
                        const isTuesday = getDay(day) === 2;
                        const isCustomHoliday = isHoliday(day);

                        if (isSunday) {
                            status = 'holiday';
                        } else if (isTuesday && profile?.department === "tech") {
                            status = 'sunday'; // Off day only for tech department
                        } else if (isCustomHoliday) {
                            status = 'holiday';
                        } else if (day <= today) {
                            status = 'absent'; // Only mark as absent for past dates
                        }
                    }

                    const isLeaveApplied = att?.status === 'leaveApplied';
                    const isLeaveApproved = att?.status === 'leaveApproved';

                    const dayTextColor = isBeforeJoining
                        ? 'text-gray-300'
                        : isLeaveApplied
                            ? 'text-gray-600'
                            : isLeaveApproved
                                ? 'text-white'
                                : isCurrentMonth
                                    ? 'text-gray-900'
                                    : 'text-gray-400';

                    const dayBgColor = isLeaveApproved ? 'bg-[#e8d15dff] rounded-full' : '';

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (isBeforeJoining) return;
                                setSelectedDate(day);
                                setPopupData(att || {
                                    status: status || 'No data',
                                    checkIn: att?.checkIn || '-',
                                    checkOut: att?.checkOut || '-',
                                    workingHours: att?.workingHours || 0,
                                });
                            }}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition ${dayBgColor} ${isBeforeJoining
                                ? 'cursor-not-allowed hover:ring-0'
                                : 'cursor-pointer hover:ring-2 hover:ring-gray-300'
                                }`}
                            title={
                                isBeforeJoining
                                    ? ''
                                    : isTodayDate
                                        ? att?.checkIn
                                            ? 'Checked In'
                                            : status === 'approved'
                                                ? 'Leave Approved'
                                                : 'Today'
                                        : status === 'sunday'
                                            ? (profile.department === "tech" ? 'Off Day (Tuesday)' : att?.status || 'No data')
                                            : status === 'holiday'
                                                ? 'Holiday'
                                                : att
                                                    ? att.status
                                                    : 'No data'
                            }
                        >
                            {!isTodayDate && !isBeforeJoining && <SplitCircle status={status} isToday={false} size={40} />}
                            {isBeforeJoining && <div className="absolute inset-0 bg-transparent"></div>}
                            <span
                                className={`absolute text-xs font-bold ${isTodayDate ? 'text-[#48a84dff] font-bold' : dayTextColor
                                    }`}
                            >
                                {format(day, 'd')}
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
                    <div className="flex items-center gap=2">
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
                                                            start: date
                                                        }));
                                                    }}
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
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    min={leaveRange.start ? format(leaveRange.start, 'yyyy-MM-dd') : ''}
                                                    required
                                                />
                                            </div>
                                            <ComboBox title={"Leave Type"} data={["casual", "earned", "sick", "emergency", "first half", "second half"]} required={true} value={leaveRange.leaveType || ''}
                                                onChange={(e) => setLeaveRange(prev => ({
                                                    ...prev,
                                                    leaveType: e
                                                }))} />
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