'use client';
import React, { useState, useMemo, Fragment, useContext, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear, isSunday,
    set,
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
const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const start = inH * 60 + inM;
    const end = outH * 60 + outM;
    const diffMinutes = Math.max(0, end - start);
    return diffMinutes / 60; // hours as decimal
};

// Helper: Determine status
const determineStatus = (checkIn, checkOut, leaveType, leaveStatus) => {
    const fullDayHrs = 8.75; // 8h 45m
    const halfDayHrs = 4.25; // 4h 15m

    if (!checkIn && !checkOut && !leaveType) return 'absent';

    const toDecimal = (time) => {
        if (!time) return null;
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
    };

    const calculateHours = (inTime, outTime) => {
        if (!inTime || !outTime) return 0;
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        const minutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
        return minutes / 60;
    };

    const workingHours = calculateHours(checkIn, checkOut);
    const checkInDec = toDecimal(checkIn);
    const checkOutDec = toDecimal(checkOut);

    // ----- LEAVE LOGIC -----
    if (leaveStatus === 'firstHalfApproved') {
        const secondHalfPresent = checkInDec >= 9.5 && checkInDec <= 13.5 && checkOutDec >= 18.0;
        return secondHalfPresent ? 'firstHalfApproved_present' : 'firstHalfApproved_absent';
    }

    if (leaveStatus === 'secondHalfApproved') {
        const firstHalfPresent = checkInDec <= 9.5 && checkOutDec >= 14.0;
        return firstHalfPresent ? 'secondHalfApproved_present' : 'secondHalfApproved_absent';
    }

    if (leaveType === 'full' && leaveStatus === 'approved') return 'leaveApproved';

    if (leaveType === 'firstHalf' && leaveStatus === 'approved') {
        if (workingHours >= halfDayHrs) return 'secondhalfp';
        return 'firsthalfa';
    }

    if (leaveType === 'secondHalf' && leaveStatus === 'approved') {
        if (workingHours >= halfDayHrs) return 'firstHalfp';
        return 'secondhalfa';
    }

    // ----- PURE ATTENDANCE (no leave) -----
    if (!checkIn || !checkOut) return 'absent';

    if (workingHours >= fullDayHrs) return 'present';

    // 👉 Correct half-day logic purely by time of day
    // If employee comes late (after 12) → second half present
    if (checkInDec >= 12) return 'secondhalfp';

    // If employee leaves early (before 14) → first half present
    if (checkOutDec <= 14) return 'firstHalfp';

    // If worked enough for half-day but spans both → mark as firstHalfp by default
    if (workingHours >= halfDayHrs) return 'firstHalfp';

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
                let workingHours = calculateWorkingHours(att.checkIn, att.checkOut);
                let status = determineStatus(att.checkIn, att.checkOut, att.leaveType, att.status, att.date);

                // Handle leave states - check for approved half days first
                if (att.status === "firstHalfApproved" || att.status === "secondHalfApproved") {
                    // Status is already determined by determineStatus function
                    // No need to override it here
                } else if (att.leaveType) {
                    if (att.status === "pending") status = "leaveApplied";
                    else if (att.status === "approved") status = "leaveApproved";
                    else if (att.status === "rejected") status = "leaveRejected";
                    else status = "leaveApplied";
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

            if (isPastOrToday && isCurrentMonth && !map[dayStr] && isAfterJoining) {
                map[dayStr] = { status: 'absent', workingHours: 0 };
            }
            // If date is before date of joining, don't mark as absent (leave it undefined)
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
    const isTodaySunday = isSunday(today);
    const isTodayHoliday = isHoliday(today);

    const applyLeave = async () => {
        if (!leaveRange.start || !leaveRange.end || !leaveRange.leaveType) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "warning",
                    title: "warning",
                    message: 'Please fill all required fields',
                },
            }));
        }
        setServiceCall(true)
        try {
            const res = await fetch('/api/leave/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employeeId,
                    startDate: format(leaveRange.start, 'yyyy-MM-dd'),
                    endDate: format(leaveRange.end, 'yyyy-MM-dd'),
                    leaveType: leaveRange.leaveType,
                    reason: leaveRange.reason || ''
                })
            });
            if (res.status) {
                setServiceCall(false)
            }
            const data = await res.json();

            if (res.ok) {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "success",
                        message: "Leave Applied successfully!",
                    },
                }));
                handleCloseLeaveModal();
                mutated();
            } else {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: `${data.error}` || 'Failed to apply leave',
                    },
                }));
            }
        } catch (err) {
            console.error(err);
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: 'Error applying leave',
                },
            }));
        }
    };


    // Determine if today has leave applied
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayAttendance = attendanceMap[todayStr];
    const isLeaveAppliedToday = todayAttendance && (
        todayAttendance.status === 'leaveApplied' ||
        todayAttendance.status === 'leaveApproved'
    );

    // Update disabled states
    const isCheckInDisabled = isCheckedIn || isTodaySunday || isTodayHoliday || isBefore9AM() || isLeaveAppliedToday;
    const hasWorkedEnough = useMemo(() => {
        if (!todayAttendance?.checkIn) return false;

        const [hours, minutes] = todayAttendance.checkIn.split(":").map(Number);
        const checkInTime = set(new Date(), { hours, minutes, seconds: 0, milliseconds: 0 });
        const diffMinutes = differenceInMinutes(currentTime, checkInTime);

        return diffMinutes >= 255; // 4.25 hours = 255 minutes
    }, [todayAttendance, currentTime]);

    // ✅  Final disable condition
    const isCheckOutDisabled =
        !isCheckedIn ||
        isTodaySunday ||
        isTodayHoliday ||
        isLeaveAppliedToday ||
        !hasWorkedEnough;

    // ✅ 6. Auto-refresh current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

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
                    {isCheckedIn ? 'Already Checked In' : isBefore9AM() ? 'Check In (After 9 AM)' : 'Check In'}
                </button>
                <button
                    onClick={onCheckOut}
                    disabled={isCheckOutDisabled}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${isCheckOutDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    Check Out
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

            <div className="grid grid-cols-7 gap-2 text-sm mt-2">
                {allDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const att = attendanceMap[dayStr];
                    const isTodayDate = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    const isCurrentMonth = getMonth(day) === getMonth(currentDate);

                    // Check if date is before date of joining
                    const dateOfJoining = profile?.dateOfJoining ? new Date(profile.dateOfJoining) : null;
                    const isBeforeJoining = dateOfJoining ? day < dateOfJoining : false;

                    // Determine status
                    let status = att?.status || null;
                    if (isSunday(day) && isCurrentMonth) status = 'sunday';
                    else if (isHoliday(day)) status = 'holiday';
                    // If date is before joining, don't show any status
                    else if (isBeforeJoining) status = null;

                    // Handle leave text/bg color
                    const isLeaveApplied = att?.status === 'leaveApplied';
                    const isLeaveApproved = att?.status === 'leaveApproved';

                    // Text color for the day number
                    const dayTextColor = isBeforeJoining
                        ? 'text-gray-300'  // Light gray for dates before joining
                        : isLeaveApplied
                            ? 'text-gray-600'
                            : isLeaveApproved
                                ? 'text-white'
                                : isCurrentMonth
                                    ? 'text-gray-900'
                                    : 'text-gray-400';

                    // Optional: background for approved leave
                    const dayBgColor = isLeaveApproved
                        ? 'bg-[#e8d15dff] rounded-full'
                        : '';

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (isBeforeJoining) return; // Don't show popup for dates before joining
                                setSelectedDate(day);
                                setPopupData(att || {
                                    status: isTodayDate ? (att?.checkIn ? 'Checked In' : att?.leaveType ? 'Leave' : 'Today') :
                                        status === 'sunday' ? 'Sunday' :
                                            status === 'holiday' ? 'Holiday' : 'No data',
                                    checkIn: att?.checkIn || '-',
                                    checkOut: att?.checkOut || '-',
                                    workingHours: att?.workingHours || 0
                                });
                            }}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition ${dayBgColor} ${isBeforeJoining ? 'cursor-not-allowed hover:ring-0' : 'border-none ring-none cursor-pointer hover:ring-2 hover:ring-gray-300'
                                }`}
                            title={isBeforeJoining ? '' :
                                isTodayDate ? (att?.checkIn ? 'Checked In' : status === "approved" ? 'Leave Approved' : 'Today') :
                                    status === 'sunday' ? 'Sunday' :
                                        status === 'holiday' ? 'Holiday' :
                                            att ? att.status : 'No data'}
                        >
                            {!isTodayDate && !isBeforeJoining && <SplitCircle status={status} isToday={false} size={40} />}
                            {isBeforeJoining && (
                                <div className="absolute inset-0 bg-transparent"></div>
                            )}

                            <span
                                className={`absolute text-xs font-bold ${isTodayDate
                                    ? 'text-[#48a84dff] font-bold'
                                    : dayTextColor
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
                    <div className="flex items-center gap-2">
                        <SplitCircle status="holiday" size={16} isLegend={true} />
                        <span>Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="sunday" size={16} isLegend={true} />
                        <span>Sunday</span>
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
                                                    popupData?.status === "sunday" ? "Sunday" :
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
                                                disabled={!leaveRange.start || !leaveRange.end || !leaveRange.leaveType}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                Submit Leave
                                            </button>
                                            <button
                                                onClick={handleCloseLeaveModal}
                                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
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