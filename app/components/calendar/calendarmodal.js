'use client';
import React, { Fragment, useState, useContext, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { addMonths, format } from 'date-fns';
import RootContext from '../config/rootcontext';
import CalendarHeader from './calendarheader';
import MonthView from './monthview';
import EventDrawer from './eventdrawer';

const categories = ['view all', 'holiday', 'meeting', 'training', 'birthday', 'general'];

const categoryColors = {
    'view all': '#b91c1c',
    birthday: '#dc2626',
    training: '#e0193a',
    meeting: '#facc15',
    holiday: '#4ade80',
    general: '#38bdf8',
};

export default function CalendarModal({ profile, mutated, showCalendar, setShowCalendar }) {
    const { rootContext, setRootContext } = useContext(RootContext);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('view all');
    const [editData, setEditData] = useState({});
    const [mode, setMode] = useState("create")
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    const [currentDate, setCurrentDate] = useState(new Date(formattedDate));

    const events = profile.events || [];

    const mergedEvents = useMemo(() => {
        if (!profile || !events) return [];

        const merged = [...events];

        if (profile.dateOfBirth) {
            const dob = new Date(profile.dateOfBirth);
            const dobMonth = dob.getMonth();
            const dobDate = dob.getDate();

            // We'll add birthday for past, current, and future years to keep it always visible
            const yearsRange = [];
            const currentYear = new Date().getFullYear();
            for (let y = currentYear - 3; y <= currentYear + 3; y++) {
                yearsRange.push(y);
            }

            yearsRange.forEach((year) => {
                const birthday = new Date(year, dobMonth, dobDate);
                merged.push({
                    _id: `dob-event-${year}`,
                    title: "🎂 Birthday",
                    description: `${profile.name}'s Birthday`,
                    date: birthday.toISOString(),
                    type: "birthday",
                    createdAt: new Date().toISOString(),
                });
            });
        }

        return merged;
    }, [profile, events]);

    // Then apply your existing category filter
    const filteredEvents =
        selectedCategory === 'view all'
            ? mergedEvents
            : mergedEvents.filter((event) => event.type === selectedCategory);

    const nav = (dir) => {
        const delta = dir === 'next' ? 1 : -1;
        setCurrentDate((prev) => addMonths(prev, delta));
    };

    const addEvent = (event) => {
        setRootContext((prev) => ({
            ...prev,
            schedule: [...(prev.schedule || []), event],
        }));
        setShowDrawer(false);
    };

    return (
        <Transition appear show={showCalendar} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setShowCalendar(false)}>
                {/* Overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center text-gray-800">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel
                                className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col md:flex-row"
                            >
                                {/* Sidebar */}
                                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-gray-50 p-4 flex flex-col">
                                    <h2 className="text-base sm:text-lg font-semibold mb-3">Event Categories</h2>
                                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
                                        {categories.map((cat) => (
                                            <li key={cat}>
                                                <button
                                                    className={`flex items-center w-full text-left p-2 rounded-lg text-sm transition ${selectedCategory === cat
                                                        ? 'bg-yellow-100 text-yellow-700 font-medium'
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                        }`}
                                                    onClick={() => setSelectedCategory(cat)}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: categoryColors[cat] }}
                                                    ></span>
                                                    {cat}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-5 flex justify-center">
                                        <button
                                            onClick={() => setShowDrawer(true)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md w-full sm:w-auto"
                                        >
                                            + Add Event
                                        </button>
                                    </div>

                                    <div className="mt-6 border-t pt-4 overflow-y-auto">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-2">This Month's Events</h3>
                                        <div className="space-y-2 max-h-48 sm:max-h-64">
                                            {filteredEvents.length > 0 ? (
                                                filteredEvents.map((event, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-2 rounded-md border text-sm bg-white shadow-sm hover:shadow-md transition"
                                                    >
                                                        <div className="flex justify-between">
                                                            <span className="font-semibold truncate">{event.title}</span>
                                                            <span
                                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: categoryColors[event.type] }}
                                                            ></span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {format(new Date(event.date), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">No events yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Calendar Section */}
                                <div className="flex-1 flex flex-col w-full">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-base sm:text-lg font-semibold leading-6 text-gray-900 flex justify-between items-center border-b p-3 sm:p-4"
                                    >
                                        Monthly Calendar
                                        <button
                                            onClick={() => setShowCalendar(false)}
                                            className="text-gray-500 hover:text-gray-800 transition text-lg sm:text-xl"
                                        >
                                            ✕
                                        </button>
                                    </Dialog.Title>

                                    <div className="p-3 sm:p-4">
                                        <CalendarHeader
                                            view="month"
                                            currentDate={currentDate}
                                            onNext={() => nav('next')}
                                            onPrev={() => nav('prev')}
                                            onToday={() => setCurrentDate(new Date())}
                                            onAdd={() => setShowDrawer(true)}
                                        />

                                        <div className="mt-3 sm:mt-4 overflow-x-auto">
                                            <MonthView
                                                date={currentDate}
                                                events={filteredEvents}
                                                profile={profile}
                                                setEditData={setEditData}
                                                setShowDrawer={setShowDrawer}
                                                setMode={setMode}
                                                mutated={mutated}
                                                categoryColors={categoryColors}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Drawer for Adding Event */}
                                <EventDrawer
                                    profile={profile}
                                    show={showDrawer}
                                    mode={mode}
                                    onClose={() => { setShowDrawer(false); setEditData({}); setMode("create") }}
                                    onSave={addEvent}
                                    editData={editData}
                                    mutated={mutated}
                                    categories={categories}
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
