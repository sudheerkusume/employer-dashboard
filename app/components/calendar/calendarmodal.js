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
    'view all': '#A5B4FC',   // Soft indigo
    birthday: '#FDA4AF',     // Soft pink
    training: '#7DD3FC',     // Soft sky
    meeting: '#FCD34D',      // Soft amber
    holiday: '#86EFAC',      // Soft green
    general: '#93C5FD',      // Soft blue
};

export default function CalendarModal({ profile, mutated, showCalendar, setShowCalendar }) {
    const { rootContext, setRootContext } = useContext(RootContext);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('view all');
    const [editData, setEditData] = useState({});
    const [mode, setMode] = useState("create");

    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    const [currentDate, setCurrentDate] = useState(new Date(formattedDate));

    const events = profile.events || [];

    /* ✅ Merge Birthday (MONTH + YEAR locked) */
    const mergedEvents = useMemo(() => {
        if (!profile || !events) return [];

        const merged = [...events];

        if (profile.dateOfBirth) {
            const dob = new Date(profile.dateOfBirth);

            const dobMonth = dob.getMonth();
            const dobDate = dob.getDate();

            const viewingYear = currentDate.getFullYear();
            const viewingMonth = currentDate.getMonth();

            if (viewingMonth === dobMonth) {
                const birthday = new Date(viewingYear, dobMonth, dobDate);

                merged.push({
                    _id: `dob-event-${viewingYear}`,
                    title: "🎂 Birthday",
                    description: `${profile.name}'s Birthday`,
                    date: birthday.toISOString(),
                    type: "birthday",
                    createdAt: new Date().toISOString(),
                });
            }
        }

        return merged;
    }, [profile, events, currentDate]);

    /* ✅ Category Filter */
    const filteredEvents =
        selectedCategory === 'view all'
            ? mergedEvents
            : mergedEvents.filter((event) => event.type === selectedCategory);

    /* Navigation */
    const nav = (dir) => {
        const delta = dir === 'next' ? 1 : -1;
        setCurrentDate((prev) => addMonths(prev, delta));
    };

    /* Add Event */
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
                    <div className="flex min-h-full text-gray-800 items-center justify-center p-3 sm:p-4 md:p-6">

                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl bg-white text-gray-800 shadow-xl rounded-2xl overflow-hidden flex flex-col">

                                {/* ✅ TITLE BAR ALWAYS ON TOP */}
                                <div className="w-full border-b p-3 sm:p-4 flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg sm:text-xl font-semibold">Monthly Calendar</h2>
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="text-gray-600 hover:text-gray-900 text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* ✅ RESPONSIVE LAYOUT */}
                                <div className="flex flex-col md:flex-row">

                                    {/* SIDEBAR (Mobile → becomes horizontal scroll chips) */}
                                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-gray-50 p-4">

                                        <h3 className="text-sm font-semibold mb-3">Event Categories</h3>

                                        {/* MOBILE → horizontal category chips */}
                                        <div className="flex md:hidden overflow-x-auto gap-2 pb-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    className={`flex items-center flex-shrink-0 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${selectedCategory === cat
                                                            ? "bg-yellow-100 text-yellow-700 font-semibold"
                                                            : "bg-white border hover:bg-gray-100"
                                                        }`}
                                                    onClick={() => setSelectedCategory(cat)}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: categoryColors[cat] }}
                                                    />
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        {/* DESKTOP → vertical list */}
                                        <ul className="hidden md:block space-y-2">
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
                                                        />
                                                        {cat}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => setShowDrawer(true)}
                                            className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md w-full"
                                        >
                                            + Add Event
                                        </button>

                                        {/* Month Event List */}
                                        <div className="mt-5 border-t pt-4 max-h-64 overflow-y-auto">
                                            <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                                This Month's Events
                                            </h3>
                                            <div className="space-y-2">
                                                {filteredEvents.length > 0 ? (
                                                    filteredEvents.map((event, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-2 rounded-md border text-sm bg-white shadow-sm hover:shadow-md transition"
                                                        >
                                                            <div className="flex justify-between">
                                                                <span className="font-semibold truncate">{event.title}</span>
                                                                <span
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: categoryColors[event.type] }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(event.date), "MMM d, yyyy")}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">No events.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* MAIN CALENDAR */}
                                    <div className="flex-1 p-3 sm:p-4 overflow-x-auto">
                                        <CalendarHeader
                                            view="month"
                                            currentDate={currentDate}
                                            onNext={() => nav('next')}
                                            onPrev={() => nav('prev')}
                                            onToday={() => setCurrentDate(new Date())}
                                            onAdd={() => setShowDrawer(true)}
                                        />

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

                                {/* EVENT DRAWER */}
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
