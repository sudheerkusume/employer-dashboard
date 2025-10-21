'use client';
import React, { useState, useMemo } from 'react';
import { addMonths } from 'date-fns';
import MonthView from '../calendar/monthview';
import CalendarHeader from '../calendar/calendarheader';
import Sidebar from '../calendar/sidebar';

const categoryColors = {
    present: "#22c55e",
    firstHalf: "#fbbf24",
    secondHalf: "#f59e0b",
    halfDay: "#f97316",
    absent: "#ef4444",
    "Checked In": "#3b82f6", // optional color for in-progress
};

export default function CalendarTab({ profile }) {
    const myDate = new Date();
    const [currentDate, setCurrentDate] = useState(myDate);
    const [showCalendar, setShowCalendar] = useState(false);

    const nav = (dir) => {
        const delta = dir === 'next' ? 1 : -1;
        setCurrentDate(prev => addMonths(prev, delta));
    };

    // ✅ Flatten month-wise attendance to an array of events
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
                    type: item.status, // use status as type for coloring
                });
            });
        });

        return allEvents;
    }, [profile]);

    return (
        <div className="flex flex-col md:flex-row max-w-full text-gray-700">
            <Sidebar profile={profile} onGoToCalendar={() => setShowCalendar(true)} />

            <main className="flex-1 overflow-y-auto bg-white p-4">
                {showCalendar ? (
                    <>
                        <div className="flex justify-between items-center">
                            <CalendarHeader
                                currentDate={currentDate}
                                onNext={() => nav('next')}
                                onPrev={() => nav('prev')}
                            />
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Back
                            </button>
                        </div>

                        <div className="mt-4">
                            <MonthView
                                date={currentDate}
                                events={profile} // flattened events array
                                categoryColors={categoryColors}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                        Select “Go to Calendar” in the sidebar to view attendance.
                    </div>
                )}
            </main>
        </div>
    );
}
