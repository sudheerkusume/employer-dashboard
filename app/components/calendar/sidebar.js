'use client';
import React, { useState } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    isSameMonth, isToday, getMonth, setMonth, getYear, setYear
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function Sidebar({ filters, setFilters, onAdd, categoryColors }) {
    const today = new Date();

    const [currentDate, setCurrentDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
    const [selectedYear, setSelectedYear] = useState(getYear(today));
    const [selectedDate, setSelectedDate] = useState(today);

    const updateCalendarDate = (month, year) => {
        // If year is NaN (e.g., from an empty input), default to the current year from 'today'
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
        const inputValue = e.target.value; // Get the raw string value
        if (inputValue === '') {
            setSelectedYear(''); // Allow empty string for visual clearing
            // When year is cleared, you might want to revert to today's year for calculations
            updateCalendarDate(selectedMonth, getYear(today));
        } else {
            const newYear = parseInt(inputValue);
            if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
                setSelectedYear(newYear);
                updateCalendarDate(selectedMonth, newYear);
            }
            // Optionally: if the input is not a valid number but not empty,
            // you might want to keep the old selectedYear or show an error.
            // For now, it will just not update the state if it's invalid.
        }
    };

    const allCategories = ['View all', 'Personal', 'Business', 'Family', 'Holiday', 'ETC'];

    const toggleFilter = (category) => {
        const contentCategories = allCategories.filter(cat => cat !== 'View all');
        setFilters(prev => {
            if (category === 'View all') {
                if (prev.includes('View all') && prev.length === contentCategories.length + 1) {
                    return [];
                } else {
                    return ['View all', ...contentCategories];
                }
            } else {
                let newFilters = prev.includes(category)
                    ? prev.filter(f => f !== category)
                    : [...prev, category];
                const allSelected = contentCategories.every(cat => newFilters.includes(cat));
                return allSelected
                    ? [...new Set([...newFilters, 'View all'])]
                    : newFilters.filter(f => f !== 'View all');
            }
        });
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
        <div className="w-full bg-white md:w-64 border-r border-gray-200 space-y-6 overflow-auto">
            {/* Add Event Button */}
            <div className='px-4 pt-1.5'>
                <button
                    onClick={onAdd}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded shadow"
                >
                    + Add Event
                </button>
            </div>

            <div className='border-b border-gray-200'></div>

            {/* Month & Year Selector */}
            <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => {
                            const newDate = subMonths(currentDate, 1);
                            setSelectedMonth(getMonth(newDate));
                            setSelectedYear(getYear(newDate)); // Keep the actual number
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
                            value={selectedYear} // This is key: it can now be a number or an empty string
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
                            setSelectedYear(getYear(newDate)); // Keep the actual number
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
                <div className="grid grid-cols-7 gap-1 text-sm">
                    {allDays.map((day, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={`w-7 h-7 text-center leading-7 rounded cursor-pointer
    ${isToday(day) ? 'bg-yellow-100 hover:bg-yellow-100 text-gray-800 font-bold' : ''}
    ${isSameMonth(day, currentDate) ? 'text-gray-700' : 'text-gray-300'}
    ${format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'bg-yellow-300 hover:bg-yellow-300' : ''}
    hover:bg-gray-200`}
                        >
                            {format(day, 'd')}
                        </div>

                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className='p-4'>
                <p className="font-semibold mb-2">Event Filters</p>
                {allCategories.map(cat => (
                    <label key={cat} className="flex items-center space-x-2 mb-1">
                        <input
                            type="checkbox"
                            checked={filters.includes(cat)}
                            onChange={() => toggleFilter(cat)}
                            style={{ accentColor: categoryColors[cat] }}
                            className="form-checkbox h-4 w-4 text-white rounded focus:ring-transparent"
                        />
                        <span className="text-sm">{cat}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
