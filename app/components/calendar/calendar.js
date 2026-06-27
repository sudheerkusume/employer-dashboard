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
import { Mutated, useSWRFetch } from '../config/useswrfetch';
import Loading from '../common/loading';
import RootContext from '../config/rootcontext';
import ComboBox from '../common/form/combobox';
import { CalendarDaysIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/20/solid';

// Constants for working hours
const HALF_DAY_MINUTES = 270;   // 4.5 hours
const FULL_DAY_MINUTES = 540;   // 9 hours

// Format minutes to "X Hours Y Minutes"
const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0 Minutes';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs} Hour${hrs !== 1 ? 's' : ''} ${mins} Minute${mins !== 1 ? 's' : ''}`;
};

const categoryColors = {
    present: "#A8DCAB",
    wfh: "#818cf8",
    firstHalf: "#A8DCAB",
    secondHalf: "#A8DCAB",
    halfDay: "#A8DCAB",
    absent: "#ff6a6a",
    "Checked In": "#2563eb",
    leaveApproved: "#FFA500",
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

// Helper: Check if it's Sunday (holiday)
const isSundayHoliday = (date) => {
    return getDay(date) === 0; // Sunday (0) is holiday
};

// Helper: Check if date is holiday
const isHoliday = (date, globalHolidays = []) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return globalHolidays.some(h => format(new Date(h.date), 'yyyy-MM-dd') === formattedDate);
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
        return 'sunday';
    }

    const today = new Date();
    const currentDate = date ? new Date(date) : null;
    const isFutureDate = currentDate && currentDate > today;

    if (isFutureDate && !leaveStatus) {
        return { topStatus: null, bottomStatus: null };
    }

    let topStatus = 'absent';
    let bottomStatus = 'absent';
    // Extract numeric working hours from string like "9.03 hrs" or "8.50"
    const getNumericWorkingHours = (hoursStr) => {
        if (!hoursStr) return 0;
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
            if (isFutureDate) {
                return 'firstHalfApproved';
            }
            if (workingHours >= 4) {
                return 'firstHalfApproved_present';
            } else {
                return 'firstHalfApproved_absent';
            }
        }

        if (leaveType === 'second half' || leaveStatus === 'secondHalfApproved') {
            if (isFutureDate) {
                return 'secondHalfApproved';
            }
            if (workingHours >= 4) {
                return 'secondHalfApproved_present';
            } else {
                return 'secondHalfApproved_absent';
            }
        }
    }

    // Handle WFH explicitly
    if (leaveStatus === 'Present (WFH)') {
        return 'wfh';
    }

    // Handle present status (including presentLate)
    if ((workingHours >= 8.45 || leaveStatus === 'present') || leaveStatus === 'presentLate') {
        return 'present';
    }

    if ((!leaveStatus || leaveStatus === 'Checked In') && checkIn && checkOut && workingHours >= 8.45) {
        return 'present';
    }

    if (!checkIn && !checkOut) {
        if (isFutureDate) {
            return null;
        }
        return 'absent';
    }

    if (workingHours >= 8.45) {
        return 'present';
    }

    if (workingHours >= 4) {
        if (checkIn) {
            const checkInTime = checkIn.split(':').map(Number);
            const checkInHour = checkInTime[0] + (checkInTime[1] / 60);
            if (checkInHour <= 12.0) {
                return 'firstHalfp';
            } else {
                return 'secondhalfp';
            }
        }
    }

    return isFutureDate ? null : 'absent';
};

// Split Circle Component for visual indicators
const SplitCircle = ({ status, isToday, size = 40, isLegend = false }) => {
    const radius = size / 2;
    const center = radius;

    const getColors = () => {
        switch (status) {
            case 'present':
                return { top: categoryColors.present, bottom: categoryColors.present };
            case 'wfh':
                return { top: categoryColors.wfh, bottom: categoryColors.wfh };
            case 'firstHalfp':
                return { top: categoryColors.firstHalf, bottom: categoryColors.absent };
            case 'secondhalfp':
                return { top: categoryColors.absent, bottom: categoryColors.secondHalf };
            case 'firstHalfApproved':
                return { top: categoryColors.leaveApproved, bottom: 'transparent' };
            case 'secondHalfApproved':
                return { top: 'transparent', bottom: categoryColors.leaveApproved };
            case 'firstHalfApproved_present':
                return { top: categoryColors.leaveApproved, bottom: categoryColors.present };
            case 'firstHalfApproved_absent':
                return { top: categoryColors.leaveApproved, bottom: categoryColors.absent };
            case 'secondHalfApproved_present':
                return { top: categoryColors.present, bottom: categoryColors.leaveApproved };
            case 'secondHalfApproved_absent':
                return { top: categoryColors.absent, bottom: categoryColors.leaveApproved };
            case 'leaveApproved':
                return { top: categoryColors.leaveApproved, bottom: categoryColors.leaveApproved };
            case 'absent':
                return { top: categoryColors.absent, bottom: categoryColors.absent };
            case 'holiday':
                return { top: categoryColors.holiday, bottom: categoryColors.holiday };
            case 'sunday':
                return { top: categoryColors.sunday, bottom: categoryColors.sunday };
            case 'today':
                return { top: categoryColors.today, bottom: categoryColors.today };
            default:
                return isToday
                    ? { top: '#d1d5db', bottom: '#d1d5db' }
                    : { top: 'transparent', bottom: 'transparent' };
        }
    };

    const colors = getColors();

    const needsSplit = [
        'firstHalfp', 'secondhalfp',
        'firstHalfApproved', 'secondHalfApproved',
        'firstHalfApproved_present', 'firstHalfApproved_absent',
        'secondHalfApproved_present', 'secondHalfApproved_absent'
    ].includes(status);

    // For split circles, we use a horizontal split (left/right) by default.
    // The "isDiagonal" variable was removed; we use a simple left/right split.
    // If you need diagonal, you can modify, but we'll keep horizontal for consistency.
    return (
        <div
            className="relative"
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                overflow: 'hidden'
            }}
        >
            <div
                className="absolute rounded-full border border-gray-300"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: !needsSplit && colors.top !== 'transparent' ? colors.top : 'transparent',
                    borderRadius: '50%'
                }}
            />

            {needsSplit && (
                <svg
                    width={size}
                    height={size}
                    className="absolute top-0 left-0"
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ borderRadius: '50%' }}
                >
                    <defs>
                        <clipPath id={`circle-${size}`}>
                            <circle cx={center} cy={center} r={radius - 1} />
                        </clipPath>
                    </defs>

                    <g clipPath={`url(#circle-${size})`}>
                        {/* Horizontal split: left half and right half */}
                        <rect
                            x="0"
                            y="0"
                            width={size / 2}
                            height={size}
                            fill={colors.top}
                        />
                        <rect
                            x={size / 2}
                            y="0"
                            width={size / 2}
                            height={size}
                            fill={colors.bottom}
                        />
                    </g>
                </svg>
            )}

            {isToday && !status && (
                <div
                    className="absolute rounded-full border-2 border-gray-600"
                    style={{
                        width: size,
                        height: size,
                        top: 0,
                        left: 0,
                        borderRadius: '50%'
                    }}
                />
            )}
        </div>
    );
};


export default function Calendar({ profile, onGoToCalendar, onCheckIn, onCheckOut, isCheckedIn, setMonthName }) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
    const [selectedYear, setSelectedYear] = useState(getYear(today));
    const [selectedDate, setSelectedDate] = useState(null);
    const [popupData, setPopupData] = useState(null);
    const { setRootContext } = useContext(RootContext);
    const { data: globalHolidaysData } = useSWRFetch("/api/holidays");
    const globalHolidays = globalHolidaysData || [];
    // Leave modal states
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [isSelectingLeave, setIsSelectingLeave] = useState(false);
    const [leaveRange, setLeaveRange] = useState({
        start: null,
        end: null,
        leaveType: '',
        reason: ''
    });

    // Early logout modal state
    const [earlyLogoutModal, setEarlyLogoutModal] = useState({
        open: false,
        workedMinutes: 0,
        requiredMinutes: 0,
        message: '',
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

        const currentMonthName = format(currentDate, 'MMMM');
        if (profile.attendance[currentMonthName]) {
            profile.attendance[currentMonthName].forEach(att => {
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

            if (!isAfterJoining || !isCurrentMonth) return;

            const isSunday = isSundayHoliday(day);
            const isHolidayDay = isHoliday(day, globalHolidays);

            if (isPastDate && !map[dayStr]) {
                if (isSunday) {
                    map[dayStr] = { status: 'sunday', workingHours: 0 };
                } else if (isHolidayDay) {
                    map[dayStr] = { status: 'holiday', workingHours: 0 };
                } else {
                    map[dayStr] = { status: 'absent', workingHours: 0 };
                }
            }
        });

        return map;
    }, [profile, currentDate, allDays, globalHolidays, today]);


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
    const isTodayHoliday = isHoliday(today, globalHolidays);

    // Determine if today has leave applied
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayAttendance = attendanceMap[todayStr];
    const isLeaveAppliedToday = todayAttendance && (
        todayAttendance.status === 'leaveApplied' ||
        todayAttendance.status === 'leaveApproved'
    );

    // Login button: we only disable if user is already checked in? The requirement says do not disable login button. 
    // We'll remove all disabling - the handler will manage it.
    // We'll keep the button enabled always, but the parent onCheckIn may handle the case.
    // For completeness, we can set disabled to false.
    const isCheckInDisabled = false; // Always enabled as per requirement

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
            return day === 0; // Sunday (0)
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
        today.setHours(0, 0, 0, 0);

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

        // Step 3: Prevent leave on restricted days (Monday and Saturday)
        const daysInRange = eachDayOfInterval({
            start: leaveRange.start,
            end: leaveRange.end,
        });

        const invalidDays = daysInRange.filter(date => {
            const day = getDay(date);
            return day === 1 || day === 6; // Monday or Saturday
        });

        if (invalidDays.length > 0) {
            const restrictedDays = invalidDays.map(d => {
                const dayName = format(d, "EEE");
                return `${format(d, "MMM dd")} (${dayName})`;
            }).join(", ");
            const errorMessage = `Leave cannot be applied on Monday or Saturday. Please remove: ${restrictedDays}`;

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
            return;
        }

        // Step 4: Validate half-day leaves
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
                mutated();
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
            console.log("Error applying leave:", err);
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
            return day === 1 || day === 6;
        });

        return { hasInvalidDays: invalidDays.length > 0, invalidDays };
    };

    const handleStartDateChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setLeaveRange(prev => ({
            ...prev,
            start: date
        }));

        if (date && leaveRange.end) {
            const { hasInvalidDays, invalidDays } = checkInvalidDays(date, leaveRange.end);
            if (hasInvalidDays) {
                const restrictedDays = invalidDays.map(d => format(d, "EEE, MMM dd")).join(", ");
                const message = `Leave cannot be applied on Monday or Saturday. Invalid days: ${restrictedDays}`;
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

        if (date && leaveRange.start) {
            const { hasInvalidDays, invalidDays } = checkInvalidDays(leaveRange.start, date);
            if (hasInvalidDays) {
                const restrictedDays = invalidDays.map(d => format(d, "EEE, MMM dd")).join(", ");
                const message = `Leave cannot be applied on Monday or Saturday. Invalid days: ${restrictedDays}`;
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

    // Handle logout click with early logout validation
    const handleLogoutClick = () => {
        if (!isCheckedIn) {
            // If not checked in, just call parent's onCheckOut (or do nothing)
            onCheckOut();
            return;
        }

        // Compute worked minutes from check-in to now
        const todayStr = format(today, 'yyyy-MM-dd');
        const att = attendanceMap[todayStr];
        if (!att || !att.checkIn) {
            onCheckOut();
            return;
        }

        const [inH, inM] = att.checkIn.split(':').map(Number);
        const checkInTime = set(new Date(), { hours: inH, minutes: inM, seconds: 0, milliseconds: 0 });
        const workedMinutes = differenceInMinutes(currentTime, checkInTime);

        const requiredHalfDay = HALF_DAY_MINUTES;
        const requiredFullDay = FULL_DAY_MINUTES;

        let message = '';
        let requiredMinutes = 0;
        if (workedMinutes < requiredHalfDay) {
            const remaining = requiredHalfDay - workedMinutes;
            message = `You have worked for ${formatDuration(workedMinutes)}.\nYou need ${formatDuration(remaining)} more to complete the minimum Half-Day (${formatDuration(requiredHalfDay)}).\nAre you sure you want to logout?`;
            requiredMinutes = requiredHalfDay;
        } else if (workedMinutes < requiredFullDay) {
            message = `Half-Day requirement completed (${formatDuration(workedMinutes)}).\nFull-Day requires ${formatDuration(requiredFullDay)}.\nAre you sure you want to logout?`;
            requiredMinutes = requiredFullDay;
        } else {
            message = `Full-Day requirement completed (${formatDuration(workedMinutes)}).\nAre you sure you want to logout?`;
            requiredMinutes = requiredFullDay;
        }

        setEarlyLogoutModal({
            open: true,
            workedMinutes,
            requiredMinutes,
            message,
        });
    };

    const confirmLogout = () => {
        setEarlyLogoutModal({ ...earlyLogoutModal, open: false });
        onCheckOut();
    };

    return (
        <div className=" p-2 sm:p-4 space-y-3 relative bg-gray-50 border-r border-gray-200">
            {serviceCall && <Loading />}
            <div className="grid grid-cols-2 sm:grid-cols-4 justify-between gap-2 mb-3">
                {/* Login button always enabled */}
                <button
                    onClick={onCheckIn}
                    className="flex-1 px-3 py-2 text-sm rounded-lg transition bg-blue-600 text-white hover:bg-blue-700"
                >
                    {"Login"}
                </button>

                {/* Logout button always enabled */}
                <button
                    onClick={handleLogoutClick}
                    className="flex-1 px-3 py-2 text-sm rounded-lg transition bg-green-600 text-white hover:bg-green-700"
                >
                    {"Logout"}
                </button>
                <button
                    onClick={handleOpenLeaveModal}
                    className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    Leave
                </button>
                <button
                    onClick={onGoToCalendar}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                    <CalendarDaysIcon className="w-5 h-5" />
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

            <div className="grid grid-cols-7 gap-2 text-sm mt-2 text-center place-items-center">
                {allDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const att = attendanceMap[dayStr];
                    const isTodayDate = dayStr === format(today, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isFutureDate = day > today;

                    const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;
                    const isBeforeJoining = dateOfJoining ? day < dateOfJoining : false;

                    const isSunday = isSundayHoliday(day);
                    const isHolidayDay = isHoliday(day, globalHolidays);

                    let status = att?.status || null;

                    if (status === "presentLate") status = "present";

                    // No marking before joining
                    if (isBeforeJoining) {
                        status = null;
                    } else if (!att && isCurrentMonth) {
                        if (isHolidayDay) status = "holiday";
                        else if (isSunday) status = "sunday";
                    }

                    if (!att && isFutureDate && isCurrentMonth && !isBeforeJoining) {
                        if (isSunday) status = "sunday";
                        else if (isHolidayDay) status = "holiday";
                        else status = null;
                    }

                    const isLeaveApplied = att?.status === "leaveApplied";
                    const isLeaveApproved = att?.status === "leaveApproved";

                    // Determine if it's a working day (not Sunday, holiday)
                    const isWorkingDay = !isSunday && !isHolidayDay;

                    let dayTextColor = "text-gray-900";

                    if (isBeforeJoining || !isCurrentMonth) {
                        dayTextColor = "text-gray-300";
                    } else if (isLeaveApplied) {
                        dayTextColor = "text-gray-600";
                    } else if (isLeaveApproved) {
                        dayTextColor = "text-white";
                    } else if (isTodayDate && isWorkingDay) {
                        dayTextColor = "text-[#48a84dff] font-bold";
                    } else if (status === 'sunday' || status === 'holiday') {
                        dayTextColor = "text-gray-900";
                    }

                    const dayBgColor = isLeaveApproved ? "bg-[#e8d15dff] rounded-full" : "";

                    // Build title string correctly
                    let titleText = "";
                    if (isBeforeJoining || !isCurrentMonth) {
                        titleText = "";
                    } else if (isTodayDate) {
                        if (att?.checkIn) {
                            titleText = "Checked In";
                        } else if (status === "approved") {
                            titleText = "Leave Approved";
                        } else {
                            titleText = "Today";
                        }
                    } else if (status === "sunday") {
                        titleText = "Sunday";
                    } else if (status === "holiday") {
                        titleText = "Holiday";
                    } else if (att) {
                        titleText = att.status || "No data";
                    } else if (isFutureDate) {
                        titleText = "Future Date";
                    } else {
                        titleText = "No data";
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (isBeforeJoining || !isCurrentMonth) return;

                                setSelectedDate(day);
                                const baseData = att || { status: status || "No data", checkIn: '-', checkOut: '-', workingHours: 0 };
                                const isToday = dayStr === format(today, 'yyyy-MM-dd');
                                setPopupData({
                                    ...baseData,
                                    isToday,
                                    checkIn: baseData.checkIn || '-',
                                    checkOut: baseData.checkOut || '-',
                                    status: baseData.status || (isToday && isCheckedIn ? 'Checked In' : baseData.status),
                                    workingHours: baseData.workingHours || 0,
                                });
                            }}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition 
                    ${dayBgColor} 
                    ${isBeforeJoining || !isCurrentMonth
                                    ? "cursor-not-allowed hover:ring-0"
                                    : "cursor-pointer hover:ring-2 hover:ring-gray-300"
                                }`}
                            title={titleText}
                        >
                            {!isTodayDate &&
                                !isBeforeJoining &&
                                isCurrentMonth &&
                                status && <SplitCircle status={status} isToday={false} size={40} />}

                            <span
                                className={`absolute text-xs font-bold ${dayTextColor}`}
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
                        <SplitCircle status="wfh" size={16} isLegend={true} />
                        <span>WFH</span>
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

            {/* Day Popup Modal */}
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
                                        {(() => {
                                            const isTodayPopup = popupData?.isToday && selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                                            let displayStatus = popupData?.status;
                                            let displayCheckOut = popupData?.checkOut;
                                            let displayWorkingHours = popupData?.workingHours;
                                            let remainingTime = null;
                                            const requiredHalfDay = HALF_DAY_MINUTES;
                                            const requiredFullDay = FULL_DAY_MINUTES;

                                            if (isTodayPopup && isCheckedIn && popupData?.checkIn && popupData?.checkIn !== '-') {
                                                const [inH, inM] = popupData.checkIn.split(':').map(Number);
                                                const checkInTime = set(new Date(), { hours: inH, minutes: inM, seconds: 0, milliseconds: 0 });
                                                const workedMinutes = differenceInMinutes(currentTime, checkInTime);
                                                displayWorkingHours = workedMinutes / 60;
                                                displayStatus = 'Checked In';
                                                displayCheckOut = 'In Progress';

                                                if (workedMinutes < HALF_DAY_MINUTES) {
                                                    remainingTime = HALF_DAY_MINUTES - workedMinutes;
                                                }
                                            }

                                            return (
                                                <>
                                                    <p><strong>Status:</strong> {
                                                        displayStatus === "secondHalf" ? "Second Half" :
                                                            displayStatus === "firstHalf" ? "First Half" :
                                                                displayStatus === "sunday" ? "Sunday" :
                                                                    displayStatus === "holiday" ? "Holiday" :
                                                                        displayStatus
                                                    }</p>
                                                    <p><strong>Check-in:</strong> {popupData?.checkIn}</p>
                                                    <p><strong>Check-out:</strong> {displayCheckOut}</p>
                                                    <p><strong>Working Hours:</strong> {typeof displayWorkingHours === 'number' ? formatDuration(displayWorkingHours * 60) : '0.00'}</p>
                                                    {isTodayPopup && isCheckedIn && remainingTime !== null && (
                                                        <>
                                                            <p><strong>Required for Half-Day:</strong> {formatDuration(HALF_DAY_MINUTES)}</p>
                                                            <p><strong>Remaining:</strong> {formatDuration(remainingTime)}</p>
                                                        </>
                                                    )}
                                                    {isTodayPopup && isCheckedIn && remainingTime === null && displayWorkingHours * 60 >= HALF_DAY_MINUTES && displayWorkingHours * 60 < FULL_DAY_MINUTES && (
                                                        <p><strong>Half-Day requirement completed.</strong></p>
                                                    )}
                                                    {isTodayPopup && isCheckedIn && displayWorkingHours * 60 >= FULL_DAY_MINUTES && (
                                                        <p><strong>Full-Day requirement completed.</strong></p>
                                                    )}
                                                </>
                                            );
                                        })()}
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
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> Leave can only be applied for today ({format(today, 'MMM dd, yyyy')}) and future dates.
                                            </p>
                                        </div>

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
                                                            end: date
                                                        }));
                                                    }}
                                                    min={format(today, 'yyyy-MM-dd')}
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

            {/* Early Logout Confirmation Modal */}
            <Transition appear show={earlyLogoutModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setEarlyLogoutModal({ ...earlyLogoutModal, open: false })}>
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        ⚠️ Early Logout
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{earlyLogoutModal.message}</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={confirmLogout}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                        >
                                            Logout
                                        </button>
                                        <button
                                            onClick={() => setEarlyLogoutModal({ ...earlyLogoutModal, open: false })}
                                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                                        >
                                            Cancel
                                        </button>
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