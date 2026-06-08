"use client";
import React, { useState, useMemo } from "react";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import { motion, AnimatePresence } from "framer-motion";
import { BuildingOfficeIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Outfit } from "next/font/google";
import { format } from "date-fns";

const outfit = Outfit({ subsets: ["latin"] });

export default function AdminDepartmentsPage() {
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const {
        data: employeesData,
        error: employeesError,
        isLoading: employeesLoading,
    } = useSWRFetch("/api/employees");

    const departmentData = useMemo(() => {
        if (!employeesData) return { departments: [], summary: { totalDepartments: 0, totalEmployees: 0 } };

        const groups = {};
        
        employeesData.forEach(emp => {
            const deptName = emp.department ? emp.department.trim() : "Unassigned";
            if (!groups[deptName]) {
                groups[deptName] = {
                    name: deptName,
                    employees: []
                };
            }
            groups[deptName].employees.push(emp);
        });

        const departments = Object.values(groups).sort((a, b) => {
            if (a.name === "Unassigned") return 1;
            if (b.name === "Unassigned") return -1;
            return a.name.localeCompare(b.name);
        });

        return {
            departments,
            summary: {
                totalDepartments: departments.filter(d => d.name !== "Unassigned").length,
                totalEmployees: employeesData.length
            }
        };
    }, [employeesData]);

    if (employeesError) return <Error />;
    if (employeesLoading) return <Loading />;

    // Generate random but consistent colors for department cards
    const getColorClass = (name) => {
        if (name === "Unassigned") return "bg-gray-50 text-gray-700 border-gray-200";
        
        const colors = [
            "bg-orange-50 text-orange-700 border-orange-200",
            "bg-blue-50 text-blue-700 border-blue-200",
            "bg-emerald-50 text-emerald-700 border-emerald-200",
            "bg-purple-50 text-purple-700 border-purple-200",
            "bg-pink-50 text-pink-700 border-pink-200",
            "bg-indigo-50 text-indigo-700 border-indigo-200"
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10 font-sans text-gray-900">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className={`${outfit.className} text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
                    Company <span className="text-orange-500">Departments</span>
                </h1>
                <p className="text-gray-500 mt-1 font-medium text-sm">Overview of organizational structure and teams.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Departments</p>
                        <h3 className="text-2xl font-black text-gray-900">{departmentData.summary.totalDepartments}</h3>
                    </div>
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <UsersIcon className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Employees</p>
                        <h3 className="text-2xl font-black text-gray-900">{departmentData.summary.totalEmployees}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentData.departments.map(dept => {
                    const colorClass = getColorClass(dept.name);
                    const bgClass = colorClass.split(' ')[0];
                    const borderClass = colorClass.split(' ')[2];
                    
                    return (
                        <motion.div 
                            key={dept.name}
                            whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer"
                            onClick={() => setSelectedDepartment(dept)}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${borderClass} border`}>
                                    <BuildingOfficeIcon className={`w-6 h-6 ${colorClass.split(' ')[1]}`} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass} bg-opacity-50`}>
                                    {dept.employees.length} Member{dept.employees.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={dept.name}>
                                {dept.name}
                            </h3>
                            
                            {/* Face pile preview */}
                            <div className="flex items-center gap-2 mt-4">
                                <div className="flex -space-x-3">
                                    {dept.employees.slice(0, 5).map((emp, i) => (
                                        <div key={emp._id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden z-10 flex items-center justify-center text-[10px] font-bold text-gray-600" style={{ zIndex: 10 - i }}>
                                            {emp.profileImage ? <img src={emp.profileImage} className="w-full h-full object-cover" /> : (emp.name ? emp.name.charAt(0) : 'U')}
                                        </div>
                                    ))}
                                    {dept.employees.length > 5 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600" style={{ zIndex: 0 }}>
                                            +{dept.employees.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Department Detail Modal */}
            <AnimatePresence>
                {selectedDepartment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClass(selectedDepartment.name)} bg-opacity-20 border`}>
                                        <BuildingOfficeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedDepartment.name} Department</h2>
                                        <p className="text-sm font-medium text-gray-500">{selectedDepartment.employees.length} Members</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedDepartment(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body - Employee List */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedDepartment.employees.map(emp => (
                                        <div key={emp._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden shrink-0">
                                                {emp.profileImage ? <img src={emp.profileImage} className="w-full h-full object-cover" /> : (emp.name ? emp.name.charAt(0) : 'U')}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-gray-900 truncate">{emp.name}</h4>
                                                <p className="text-xs text-gray-500 font-medium capitalize truncate">{emp.role ? emp.role.replace('_', ' ') : 'Employee'} • {emp.designation || 'No Designation'}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-xs text-gray-400 font-medium mb-1">Joined</p>
                                                <p className="text-xs font-bold text-gray-700">{emp.dateOfJoining ? format(new Date(emp.dateOfJoining), "MMM yyyy") : "N/A"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
