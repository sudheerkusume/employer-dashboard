"use client";
import React, { useState, useMemo } from "react";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, PlusIcon, TrashIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Outfit } from "next/font/google";
import { format, isAfter, isToday } from "date-fns";
import { mutate } from "swr";

const outfit = Outfit({ subsets: ["latin"] });

export default function AdminHolidaysPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", date: "", type: "Mandatory" });

    const {
        data: holidaysData,
        error: holidaysError,
        isLoading: holidaysLoading,
    } = useSWRFetch("/api/holidays");

    const summary = useMemo(() => {
        if (!holidaysData) return { total: 0, upcoming: 0 };
        const now = new Date();
        const upcoming = holidaysData.filter(h => isAfter(new Date(h.date), now) || isToday(new Date(h.date))).length;
        return { total: holidaysData.length, upcoming };
    }, [holidaysData]);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                mutate("/api/holidays");
                setIsAddModalOpen(false);
                setFormData({ name: "", date: "", type: "Mandatory" });
            }
        } catch (error) {
            console.error("Error adding holiday:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return;
        try {
            const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                mutate("/api/holidays");
            }
        } catch (error) {
            console.error("Error deleting holiday:", error);
        }
    };

    if (holidaysError) return <Error />;
    if (holidaysLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10 font-sans text-gray-900">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className={`${outfit.className} text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
                        Company <span className="text-orange-500">Holidays</span>
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium text-sm">Manage global holidays for all employees.</p>
                </div>
                
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" /> Add Holiday
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                        <CalendarIcon className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Holidays</p>
                        <h3 className="text-2xl font-black text-gray-900">{summary.total} <span className="text-sm font-medium text-gray-400">This Year</span></h3>
                    </div>
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <SparklesIcon className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming</p>
                        <h3 className="text-2xl font-black text-gray-900">{summary.upcoming} <span className="text-sm font-medium text-gray-400">Remaining</span></h3>
                    </div>
                </motion.div>
            </div>

            {/* Holidays List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Holiday Name</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {holidaysData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">
                                        No holidays scheduled yet. Click "Add Holiday" to get started.
                                    </td>
                                </tr>
                            ) : (
                                holidaysData.map(holiday => {
                                    const holidayDate = new Date(holiday.date);
                                    const isPast = !isAfter(holidayDate, new Date()) && !isToday(holidayDate);
                                    
                                    return (
                                        <motion.tr 
                                            key={holiday._id}
                                            whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                                            className={`transition-colors group ${isPast ? 'opacity-60' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{format(holidayDate, "MMM dd, yyyy")}</div>
                                                <div className="text-xs text-gray-500 font-medium">{format(holidayDate, "EEEE")}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 text-base">{holiday.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${holiday.type === 'Mandatory' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                    {holiday.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteHoliday(holiday._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Holiday"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Holiday Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Add New Holiday</h2>
                                <button 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddHoliday} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Holiday Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm font-medium outline-none"
                                        placeholder="e.g. Diwali, Christmas, New Year"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm font-medium outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Holiday Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm font-medium outline-none bg-white cursor-pointer"
                                    >
                                        <option value="Mandatory">Mandatory</option>
                                        <option value="Restricted">Restricted / Optional</option>
                                    </select>
                                </div>
                                
                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-70"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Holiday'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
