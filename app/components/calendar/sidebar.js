'use client';
import React, { useState, useMemo, Fragment } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Mutated } from '../config/useswrfetch';

const categoryColors = {
    present: "#22c55e",
    firstHalf: "#fbbf24",
    secondHalf: "#f59e0b",
    halfDay: "#f97316",
    absent: "#ef4444",
    "Checked In": "#3b82f6",
    leave: "#8b5cf6", // Purple for leave
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
    const checkOutDec = timeToDecimal(checkOut);

    // Full day
    if (workingHours >= fullDayHrs) return 'present';

    // No check-in and no check-out → absent
    if (!checkIn && !checkOut) return 'absent';

    // Check-in only → first half
    if (checkIn && !checkOut) return 'firstHalf';

    // Check-out only → if checkout in afternoon and no check-in → absent
    if (!checkIn && checkOut) return 'absent';

    // Working hours >= half day → determine first or second half
    if (workingHours >= halfDayHrs) {
        // If check-in in morning → first half
        if (checkInDec && checkInDec < 12) return 'firstHalf';
        // If check-in in afternoon → second half
        if (checkInDec && checkInDec >= 12) return 'secondHalf';
    }

    // Working hours < half day → determine based on check-in/out
    if (workingHours < halfDayHrs) {
        if (checkInDec && checkInDec < 12) return 'firstHalf';
        if (checkInDec && checkInDec >= 12) return 'secondHalf';
    }

    // Fallback
    return 'absent';
};


export default function Sidebar({ profile, onGoToCalendar }) {
    const today = new Date();

    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
    const [selectedYear, setSelectedYear] = useState(getYear(today));
    const [selectedDate, setSelectedDate] = useState(null);
    const [popupData, setPopupData] = useState(null);

    // Leave modal states
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [isSelectingLeave, setIsSelectingLeave] = useState(false);
    // Close leave modal and reset selection state
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

    const attendanceMap = useMemo(() => {
        const map = {};
        if (!profile?.attendance) return map;

        Object.keys(profile.attendance).forEach(monthName => {
            profile.attendance[monthName].forEach(att => {
                let workingHours = calculateWorkingHours(att.checkIn, att.checkOut);
                let status = determineStatus(att.checkIn, att.checkOut);

                // If leave exists, override status
                if (att.leaveType) {
                    status = 'leave';
                }

                map[att.date] = {
                    ...att,
                    workingHours: Number(workingHours) || 0,
                    status
                };
            });
        });

        return map;
    }, [profile]);

    // Open leave modal and start leave selection
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


    // Update handleCloseLeaveModal to reset all fields
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
    // Update applyLeave to use the leaveRange state

    const mutated = Mutated(employeeId ? `/api/employees?id=${employeeId}` : null)
    const applyLeave = async () => {
        if (!leaveRange.start || !leaveRange.end || !leaveRange.leaveType) {
            return alert('Please fill all required fields');
        }

        try {
            const res = await fetch('/api/leave', {
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

            const data = await res.json();

            if (res.ok) {
                alert('Leave applied successfully');
                handleCloseLeaveModal();
                mutated();
                // Optionally refresh your data here
            } else {
                alert(data.error || 'Failed to apply leave');
            }
        } catch (err) {
            console.error(err);
            alert('Error applying leave');
        }
    };
    return (
        <div className="p-4 space-y-3 relative bg-gray-50 border-r border-gray-200">
            {/* Go to Calendar button */}
            <div className="flex justify-between gap-4 mb-3">
                <button
                    onClick={handleOpenLeaveModal}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    Apply for Leave
                </button>
                <button
                    onClick={onGoToCalendar}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Calendar
                </button>
            </div>

            {/* Month Navigation */}
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
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-sm mt-2">
                {allDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const att = attendanceMap[dayStr];
                    const status = att?.status || null;
                    const isTodayDate = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

                    let bgColor = '#ffffff';
                    if (isTodayDate) bgColor = '#d1d5db';
                    else if (status) bgColor = categoryColors[status] || '#9ca3af';

                    const textColor = (isTodayDate || status) ? '#ffffff' : '#374151';

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                setSelectedDate(day);
                                setPopupData(att || { status: 'No data', checkIn: '-', checkOut: '-', workingHours: 0 });
                            }}
                            className="w-10 h-10 flex flex-col items-center justify-center rounded-full cursor-pointer hover:ring-2 hover:ring-gray-500 transition"
                            style={{ backgroundColor: bgColor, color: textColor }}
                            title={att && `${att?.status === "secondHalf" ? "Second Half" : att?.status === "firstHalf" ? "First Half" : att?.status}`}
                        >
                            <span className="text-sm font-semibold">{format(day, 'd')}</span>
                        </div>
                    );
                })}
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
                                        <p><strong>Status:</strong> {popupData?.status === "secondHalf" ? "Second Half" : popupData?.status === "firstHalf" ? "First Half" : popupData?.status}</p>
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
