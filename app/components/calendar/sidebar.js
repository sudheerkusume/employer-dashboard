'use client';
import React, { useState, useMemo, Fragment, useContext } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear, isSunday
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Mutated } from '../config/useswrfetch';
import Loading from '../common/loading';
import RootContext from '../config/rootcontext';

const categoryColors = {
    present: "#A8DCAB",        // emerald-600, strong green for full presence
    firstHalf: "#A8DCAB",      // lime-400, lighter green for first-half present
    secondHalf: "#A8DCAB",     // lime-500, slightly darker green for second-half present
    halfDay: "#A8DCAB",        // yellow-400, amber for half-day
    absent: "#ff6a6a",         // red-600, clear red for absent
    "Checked In": "#2563eb",   // blue-600, bold blue for checked in
    leaveApplied: "#ffef9dff",   // violet-400, soft but noticeable
    leaveApproved: "#ffec8b",  // violet-700, darker violet for approval
    leaveRejected: "#ff6a6a",  // rose-600, deep pink/red for rejection
    holiday: "#d5d7d9ff",        // gray-400 for holidays
    sunday: "#d5d7d9ff",         // gray-400 for Sundays
    today: "#71cf76ff"
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
        '2025-01-01', // New Year
        '2025-01-26', // Republic Day
        '2025-03-25', // Holi
        '2025-08-15', // Independence Day
        '2025-10-02', // Gandhi Jayanti
        '2025-12-25', // Christmas
        // Add more holidays as needed
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
const determineStatus = (checkIn, checkOut) => {
    const fullDayHrs = 8.75;
    const halfDayHrs = 4.25;

    // Convert time string to decimal hours
    const timeToDecimal = (time) => {
        if (!time) return null;
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
    };

    const workingHours = calculateWorkingHours(checkIn, checkOut);
    const checkInDec = timeToDecimal(checkIn);

    // No check-in and no check-out → absent
    if (!checkIn && !checkOut) return 'absent';

    // Full day
    if (workingHours >= fullDayHrs) return 'present';

    // First half: morning (before 13:30) with enough working hours
    if (checkInDec && checkInDec < 13.5) {
        if (workingHours >= halfDayHrs) return 'firstHalf';
        return 'firstHalf'; // even if less than halfDayHrs, we treat as firstHalf
    }

    // Second half: afternoon (13:30 or later)
    if (checkInDec && checkInDec >= 13.5) {
        if (workingHours >= halfDayHrs) return 'secondHalf';
        return 'secondHalf'; // less than half-day, still secondHalf
    }

    // Check-in only → first half
    if (checkIn && !checkOut) return 'firstHalf';

    // Check-out only → absent
    if (!checkIn && checkOut) return 'absent';

    // Fallback
    return 'absent';
};

// Split Circle Component for visual indicators
const SplitCircle = ({ status, isToday, size = 40 }) => {
    const radius = size / 2;
    const center = radius;

    const getColors = () => {
        switch (status) {
            case 'present':
                return { left: categoryColors.present, right: categoryColors.present };
            case 'firstHalf':
                return { left: categoryColors.firstHalf, right: categoryColors.absent };
            case 'secondHalf':
                return { left: categoryColors.absent, right: categoryColors.secondHalf };
            case 'absent':
                return { left: categoryColors.absent, right: categoryColors.absent };
            case 'leaveApplied':
            case 'leaveApproved':
            case 'leaveRejected':
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
        </svg>
    );
};

export default function Calendar({ profile, onGoToCalendar, onCheckIn, onCheckOut, isCheckedIn }) {
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
    const attendanceMap = useMemo(() => {
        const map = {};
        if (!profile?.attendance) return map;

        Object.keys(profile.attendance).forEach(monthName => {
            profile.attendance[monthName].forEach(att => {
                let workingHours = calculateWorkingHours(att.checkIn, att.checkOut);
                let status = determineStatus(att.checkIn, att.checkOut);

                // 🎯 Handle leave states
                if (att.leaveType) {
                    if (att.status === "pending") status = "leaveApplied";
                    else if (att.status === "approved") status = "leaveApproved";
                    else if (att.status === "rejected") status = "leaveRejected";
                    else status = "leaveApplied"; // default pending color
                }

                map[att.date] = {
                    ...att,
                    workingHours: Number(workingHours) || 0,
                    status,
                };
            });
        });

        return map;
    }, [profile]);


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
                        message: "Employee added successfully!",
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
    const isCheckOutDisabled = !isCheckedIn || isTodaySunday || isTodayHoliday || isLeaveAppliedToday;


    return (
        <div className="p-4 space-y-3 relative bg-gray-50 border-r border-gray-200">
            {/* Check-in/Check-out Buttons */}
            {serviceCall && <Loading />}
            <div className="flex justify-between gap-2 mb-3">
                <button
                    onClick={onCheckIn}
                    disabled={isCheckInDisabled}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${isCheckInDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {isCheckedIn ? 'Already Checked In' : isBefore9AM() ? 'Check In (After 6 AM)' : 'Check In'}
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

                    // Only mark Sundays of active month
                    let status = att?.status || null;
                    if (isSunday(day) && isCurrentMonth) status = 'sunday';
                    else if (isHoliday(day)) status = 'holiday';

                    return (
                        <div
                            key={i}
                            onClick={() => {
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
                            className="relative w-10 h-10 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-300 rounded-full transition"
                            title={isTodayDate ? (att?.checkIn ? 'Checked In' : att?.leaveType ? 'Leave Applied' : 'Today') : status === 'sunday' ? 'Sunday' : status === 'holiday' ? 'Holiday' : att ? att.status : 'No data'}
                        >
                            {!isTodayDate && <SplitCircle status={status} isToday={false} size={40} />}

                            <span
                                className={`absolute text-xs font-bold ${isTodayDate
                                    ? 'text-[#A8DCAB] font-bold'        // Today: green & bold
                                    : (status === 'holiday' || status === 'sunday')
                                        ? 'text-gray-400'               // Holiday/Sunday: light gray
                                        : isCurrentMonth
                                            ? 'text-gray-900'           // Current month normal date
                                            : 'text-gray-400'           // Other month dates
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
                        <SplitCircle status="today" size={16} />
                        <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="present" size={16} />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="absent" size={16} />
                        <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="leaveApproved" size={16} />
                        <span>Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="holiday" size={16} />
                        <span>Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SplitCircle status="sunday" size={16} />
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

                                            {/* Leave Type Dropdown */}
                                            <div>
                                                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Leave Type *
                                                </label>
                                                <select
                                                    id="leaveType"
                                                    value={leaveRange.leaveType || ''}
                                                    onChange={(e) => setLeaveRange(prev => ({
                                                        ...prev,
                                                        leaveType: e.target.value
                                                    }))}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select Leave Type</option>
                                                    <option value="casual">Casual Leave</option>
                                                    <option value="sick">Sick Leave</option>
                                                    <option value="earned">Earned Leave</option>
                                                    <option value="emergency">Emergency Leave</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>

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

                                        {/* Selected Dates Summary */}
                                        {(leaveRange.start || leaveRange.end) && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <p className="text-sm font-medium text-blue-800 mb-1">Leave Summary:</p>
                                                <p className="text-sm text-blue-700">
                                                    <span className="font-medium">Period:</span> {leaveRange.start && format(leaveRange.start, 'PPP')}
                                                    {leaveRange.end ? ` to ${format(leaveRange.end, 'PPP')}` : ' (Select end date)'}
                                                </p>
                                                {leaveRange.start && leaveRange.end && (
                                                    <p className="text-sm text-blue-700">
                                                        <span className="font-medium">Duration:</span> {Math.ceil((leaveRange.end - leaveRange.start) / (1000 * 60 * 60 * 24)) + 1} day(s)
                                                    </p>
                                                )}
                                                {leaveRange.leaveType && (
                                                    <p className="text-sm text-blue-700">
                                                        <span className="font-medium">Type:</span> {leaveRange.leaveType.charAt(0).toUpperCase() + leaveRange.leaveType.slice(1)} Leave
                                                    </p>
                                                )}
                                            </div>
                                        )}

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