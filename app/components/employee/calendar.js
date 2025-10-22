'use client';
import React, { useState, useMemo, useContext } from 'react';
import { addMonths } from 'date-fns';
import MonthView from '../calendar/monthview';
import CalendarHeader from '../calendar/calendarheader';
import Calendar from '../calendar/calendar';
import RootContext from '../config/rootcontext';
import Loading from '../common/loading';
import { Mutated } from '../config/useswrfetch';

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

    // ✅ Filter leaves dynamically from attendance
    const leaves = useMemo(() => {
        if (!profile || !profile.attendance) return [];
        const allLeaves = [];
        Object.values(profile.attendance).forEach(monthArr => {
            monthArr.forEach(item => {
                if (item.status && item.leaveType) {
                    allLeaves.push({
                        id: item.date, // you can make this unique if needed
                        ...item
                    });
                }
            });
        });
        return allLeaves;
    }, [profile]);

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

    return (
        <div className="flex flex-col md:flex-row max-w-full text-gray-700 gap-4">
            {/* Left Calendar Section */}
            {serviceCall && <Loading />}
            <div className="flex-1">
                <Calendar
                    profile={profile}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                    isCheckedIn={isCheckedIn}
                    onGoToCalendar={() => setShowCalendar(true)}
                />
            </div>

            {/* Right Side: Leaves Section */}
            <aside className="w-full md:w-80 bg-white shadow-lg rounded-xl p-4 flex flex-col">
                <h3 className="text-lg font-semibold mb-3">Your Leaves</h3>

                {leaves.length === 0 ? (
                    <p className="text-gray-400 italic">No leave applied.</p>
                ) : (
                    <ul className="space-y-2 overflow-y-auto max-h-[500px]">
                        {leaves.map(leave => (
                            <li
                                key={leave.id}
                                className="flex justify-between items-center p-2 border border-gray-200 rounded-md"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{leave.leaveType}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(leave.date).toLocaleDateString()}
                                    </span>
                                    <span className={`text-sm font-semibold ${leave.status === 'approved' ? 'text-green-600' : 'text-yellow-500'}`}>
                                        {leave.status}
                                    </span>
                                </div>
                                {leave.status !== 'approved' && (
                                    <button
                                        onClick={() => handleWithdraw(leave.date)}
                                        disabled={loadingLeave === leave.date}
                                        className={`px-2 py-1 text-sm rounded-md font-medium text-white ${loadingLeave === leave.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {loadingLeave === leave.id ? 'Withdrawing...' : 'Withdraw'}
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
