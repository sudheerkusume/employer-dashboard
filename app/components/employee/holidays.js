"use client";
import React, { useMemo } from "react";
import { useSWRFetch } from "../config/useswrfetch";
import Loading from "../common/loading";
import Error from "../common/error";
import { format, isAfter, isToday } from "date-fns";
import { Sparkles, Calendar } from "lucide-react";

export default function Holidays() {
    const { data: holidaysData, error, isLoading } = useSWRFetch("/api/holidays");

    const sortedHolidays = useMemo(() => {
        if (!holidaysData) return [];
        return [...holidaysData].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [holidaysData]);

    if (error) return <Error />;
    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-orange-500 w-6 h-6" /> Company Holidays
            </h2>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-bold tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-4 font-bold tracking-wider">Holiday Name</th>
                            <th scope="col" className="px-6 py-4 font-bold tracking-wider">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedHolidays.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500 font-medium">
                                    No holidays scheduled yet.
                                </td>
                            </tr>
                        ) : (
                            sortedHolidays.map((holiday, idx) => {
                                const isPast = !isAfter(new Date(holiday.date), new Date()) && !isToday(new Date(holiday.date));
                                
                                return (
                                    <tr key={idx} className={`transition-colors hover:bg-gray-50/50 ${isPast ? 'opacity-50 bg-gray-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{format(new Date(holiday.date), "MMM dd, yyyy")}</div>
                                            <div className="text-xs text-gray-500 font-medium">{format(new Date(holiday.date), "EEEE")}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {!isPast && (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${holiday.type === 'Mandatory' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        <Sparkles size={14} />
                                                    </div>
                                                )}
                                                <div className="font-bold text-gray-800 text-base">{holiday.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${holiday.type === 'Mandatory' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {holiday.type}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
