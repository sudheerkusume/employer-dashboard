
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function CalendarHeader({
    currentDate,
    onNext,
    onPrev }) {

    return (
        <div className="flex flex-col lg:flex-row mt-5 justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2 text-2xl">
                <button onClick={onPrev} className="px-2 py-1"><ChevronLeftIcon className='w-4 h-4 text-2xl font-semibold' /></button>
                <button onClick={onNext} className="px-2 py-1"><ChevronRightIcon className='w-4 h-4 text-2xl font-semibold' /></button>
                <h2 className="ml-4 text-2xl font-semibold">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>

            </div>
        </div>
    );
}

