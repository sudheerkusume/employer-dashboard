'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useSWRFetch } from '@/app/components/config/useswrfetch';
import Loading from '@/app/components/common/loading';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo, Eraser,
    Strikethrough, CheckSquare, Eye, Pencil, Trash2, Download, FileText, FileSpreadsheet, Check, X
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminEodReportsPage() {
    const [userId, setUserId] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('day');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [showExport, setShowExport] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [editingReport, setEditingReport] = useState(null);
    const [editForm, setEditForm] = useState({ morningPlan: '', eveningUpdate: '', blockers: '' });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TaskList,
            TaskItem.configure({ nested: true })
        ],
        content: editForm.morningPlan,
        editorProps: {
            attributes: {
                class: 'focus:outline-none px-4 py-3 leading-relaxed text-sm',
            },
        },
        onUpdate: ({ editor }) => {
            setEditForm(prev => ({ ...prev, morningPlan: editor.getHTML() }));
        },
    });

    useEffect(() => {
        if (editor && editForm.morningPlan !== editor.getHTML()) {
            editor.commands.setContent(editForm.morningPlan);
        }
    }, [editForm.morningPlan, editor]);

    const btn = (active, onClick, title, icon, disabled) => (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`p-2 sm:p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}
        >
            {icon}
        </button>
    );

    useEffect(() => {
        const details = JSON.parse(localStorage.getItem("user_details") || "{}");
        if (details?.userId) setUserId(details.userId);
    }, []);

    const { data: employeesData, isLoading: employeesLoading } = useSWRFetch("/api/employees");

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/eod?role=admin');
            const data = await res.json();
            if (data.success) {
                // Deduplicate reports by employeeId and date (in case of old duplicate test data)
                const grouped = {};
                data.reports.forEach(report => {
                    const key = `${report.employeeId}-${report.date}`;
                    if (!grouped[key]) {
                        grouped[key] = report;
                    } else {
                        // Prioritize keeping the 'Submitted' version if there's a conflict
                        if (report.status?.toLowerCase() === 'submitted' && grouped[key].status?.toLowerCase() !== 'submitted') {
                            grouped[key] = report;
                        }
                    }
                });
                // Convert back to array and sort by date descending
                const uniqueReports = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
                setReports(uniqueReports);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        try {
            const res = await fetch('/api/eod', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });
            if (res.ok) fetchReports();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditSubmit = async () => {
        try {
            const res = await fetch('/api/eod', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'manager_edit',
                    reportId: editingReport._id,
                    content: editForm
                })
            });
            if (res.ok) {
                setEditingReport(null);
                fetchReports();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const uniqueDepartments = useMemo(() => {
        if (!employeesData) return [];
        const depts = new Set(employeesData.map(emp => emp.department || emp.designation).filter(Boolean));
        return Array.from(depts).sort();
    }, [employeesData]);

    const teamMembers = employeesData?.filter(emp => {
        if (departmentFilter === 'All') return true;
        return (emp.department === departmentFilter || emp.designation === departmentFilter);
    }) || [];

    const teamReports = reports.filter(report => {
        return teamMembers.some(tm => tm._id === report.employeeId || tm.userId === report.employeeId);
    });

    const todayDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const currentMonthStr = todayDateStr.substring(0, 7); // YYYY-MM
    const currentYear = parseInt(todayDateStr.split('-')[0]);
    const currentMonth = parseInt(todayDateStr.split('-')[1]);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const monthDays = Array.from({length: daysInMonth}, (_, i) => i + 1);

    const presentDayReports = teamReports.filter(r => r.date === todayDateStr);
    const presentMonthReports = teamReports.filter(r => r.date.startsWith(currentMonthStr));

    const isWeekend = (dateStr) => {
        const d = new Date(dateStr);
        return d.getDay() === 0; // Only Sunday is a weekend
    };

    const isOnLeave = (emp, dateStr) => {
        if (!emp.leaveRequests) return false;
        const d = new Date(dateStr);
        // Normalize times for accurate comparison
        d.setHours(0,0,0,0);
        return emp.leaveRequests.some(lr => {
            if (lr.status !== "approved") return false;
            const start = new Date(lr.startDate); start.setHours(0,0,0,0);
            const end = new Date(lr.endDate); end.setHours(23,59,59,999);
            return start <= d && end >= d;
        });
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Date', 'Employee', 'Status', 'Day Plan', 'EOD Report']
        ];
        
        // Group by employee in Excel for better sorting, or just loop team members then days
        teamMembers.forEach(emp => {
            const empName = emp.fullName || emp.name || 'Unknown';
            monthDays.forEach(day => {
                const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                const report = presentMonthReports.find(r => r.employeeId === (emp._id || emp.userId) && r.date === dateStr);
                
                if (report) {
                    let morning = report.morningPlan || '-';
                    if (morning && morning.includes('<')) morning = morning.replace(/<[^>]*>?/gm, '').trim();
                    
                    let evening = report.eveningUpdate || '-';
                    if (evening && evening.includes('<')) evening = evening.replace(/<[^>]*>?/gm, '').trim();
                    
                    wsData.push([dateStr, empName, report.status, morning || '-', evening || '-']);
                } else if (isOnLeave(emp, dateStr)) {
                    wsData.push([dateStr, empName, 'On Leave', '-', '-']);
                } else if (isWeekend(dateStr)) {
                    wsData.push([dateStr, empName, 'Weekend', '-', '-']);
                } else {
                    wsData.push([dateStr, empName, 'Not Submitted', '-', '-']);
                }
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Monthly EOD");
        XLSX.writeFile(wb, `EOD_Reports_${currentMonthStr}.xlsx`);
        setShowExport(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
        
        const deptTitle = departmentFilter === 'All' ? 'All Departments' : departmentFilter;
            
        doc.text(`Monthly EOD Reports - ${currentMonthStr} (${deptTitle})`, 14, 15);
        
        let startY = 25;
        
        teamMembers.forEach((emp, index) => {
            const empName = emp.fullName || emp.name || 'Unknown';
            
            // Add Employee Header
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            if (startY > 260) {
                doc.addPage();
                startY = 20;
            }
            doc.text(`Employee: ${empName}`, 14, startY);
            startY += 5;
            
            const head = [['Date', 'Status', 'Day Plan', 'EOD Report']];
            const body = [];
            
            monthDays.forEach(day => {
                const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                const report = presentMonthReports.find(r => r.employeeId === (emp._id || emp.userId) && r.date === dateStr);
                
                if (report) {
                    let morning = report.morningPlan || '-';
                    if (morning && morning.includes('<')) morning = morning.replace(/<[^>]*>?/gm, '').trim();
                    
                    let evening = report.eveningUpdate || '-';
                    if (evening && evening.includes('<')) evening = evening.replace(/<[^>]*>?/gm, '').trim();
                    
                    body.push([dateStr, report.status, morning || '-', evening || '-']);
                } else if (isOnLeave(emp, dateStr)) {
                    body.push([dateStr, 'On Leave', '-', '-']);
                } else if (!isWeekend(dateStr)) {
                    // Only show empty rows if it's a working day
                    body.push([dateStr, 'Not Submitted', '-', '-']);
                }
            });

            autoTable(doc, {
                startY: startY,
                head: head,
                body: body,
                styles: { fontSize: 8, cellPadding: 2, halign: 'left' },
                columnStyles: { 
                    0: { cellWidth: 22 }, 
                    1: { cellWidth: 22 }, 
                    2: { cellWidth: 'auto' }, 
                    3: { cellWidth: 'auto' } 
                },
                headStyles: { fillColor: [31, 41, 55], halign: 'left' },
            });
            
            startY = doc.lastAutoTable.finalY + 15;
        });

        doc.save(`EOD_Reports_${currentMonthStr}.pdf`);
        setShowExport(false);
    };

    if (employeesLoading || !userId) return <Loading />;

    return (
        <div className='p-4 sm:p-6 md:p-10 max-w-7xl mx-auto min-h-screen font-sans'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                <div>
                    <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight'>
                        EOD Reports
                    </h1>
                    <p className='text-gray-500 mt-1 font-medium'>
                        Review daily submissions from all employees.
                    </p>
                </div>
                <div className='flex items-center gap-3 w-full sm:w-auto flex-wrap'>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-orange-500"
                    >
                        <option value="All">All Departments</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <div className='flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto'>
                        <button onClick={() => setActiveTab('day')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Present Day</button>
                        <button onClick={() => setActiveTab('month')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Present Month</button>
                    </div>
                </div>
            </div>

            {
                loading ? (
                    <div className='flex justify-center py-20'><Loading /></div>
                ) : activeTab === 'day' ? (
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full'>
                        <div className='overflow-x-auto w-full'>
                            <table className='w-full text-left border-collapse min-w-[800px]'>
                                <thead>
                                    <tr className='bg-gray-50/80 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold'>
                                        <th className='p-4 pl-6'>Date</th>
                                        <th className='p-4'>Employee</th>
                                        <th className='p-4'>Designation</th>
                                        <th className='p-4'>Day Plan</th>
                                        <th className='p-4'>EOD</th>
                                        <th className='p-4'>Status</th>
                                        <th className='p-4 pr-6'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {
                                        presentDayReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className='p-10 text-center text-gray-400 font-medium text-sm'>
                                                    No Reports found for today.
                                                </td>
                                            </tr>
                                        ) : (
                                            presentDayReports.map((report) => {
                                                const emp = teamMembers.find(t => t._id === report.employeeId || t.userId === report.employeeId);

                                                return (
                                                    <tr key={report._id} className='hover:bg-gray-50/50 transition-colors'>
                                                        <td className='p-4 pl-6 whitespace-nowrap text-sm font-bold text-gray-800'>
                                                            {report.date}
                                                        </td>
                                                        <td className='p-4'>
                                                            <div className='font-bold text-sm text-gray-900'>{report.employeeName || emp?.fullName || emp?.name || 'Unknown Employee'}</div>
                                                        </td>
                                                        <td className='p-4'>
                                                            <span className='inline-flex items-center text-xs font-semibold text-gray-500'>{emp?.designation || report.department || 'N/A'}</span>
                                                        </td>
                                                        <td className='p-4 text-sm text-gray-600 max-w-[200px]'>
                                                            <div className='line-clamp-2' dangerouslySetInnerHTML={{ __html: report.morningPlan }} />
                                                        </td>
                                                        <td className='p-4 text-sm text-gray-600 max-w-[200px]'>
                                                            <div className='line-clamp-2 whitespace-pre-wrap'>
                                                                {
                                                                    report.eveningUpdate || <span className='italic text-gray-400'>Pending</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className='p-4'>
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{report.status}</span>
                                                        </td>
                                                        <td className='p-4 pr-6 flex flex-wrap gap-2'>
                                                            <button 
                                                                onClick={() => setSelectedReport(report)}
                                                                title="View Report"
                                                                className='text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors'
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => { setEditingReport(report); setEditForm({ morningPlan: report.morningPlan || '', eveningUpdate: report.eveningUpdate || '', blockers: report.blockers || '' }); }}
                                                                title="Edit Report"
                                                                className='text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-2 rounded-md transition-colors'
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(report._id)}
                                                                title="Delete Report"
                                                                className='text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors'
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full'>
                        <div className='p-4 border-b border-gray-100 flex justify-between items-center bg-white'>
                            <h2 className="text-sm font-semibold text-gray-800">Monthly EOD Overview - {currentMonthStr}</h2>
                            <div className="relative">
                                <button onClick={() => setShowExport(!showExport)} className="flex items-center gap-2 text-[12px] font-bold bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <Download size={14} /> Explore
                                </button>
                                {showExport && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
                                        <button onClick={exportToPDF} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50">
                                            <FileText size={16} className="text-red-500" /> Export as PDF
                                        </button>
                                        <button onClick={exportToExcel} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                            <FileSpreadsheet size={16} className="text-emerald-500" /> Export as Excel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='overflow-x-auto w-full'>
                            <table className='w-full text-left border-collapse'>
                                <thead>
                                    <tr className='bg-gray-50/80 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold'>
                                        <th className='p-4 pl-6 sticky left-0 bg-gray-50/90 backdrop-blur z-10'>Employee</th>
                                        {monthDays.map(day => (
                                            <th key={day} className='p-4 text-center min-w-[160px]'>{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {teamMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={monthDays.length + 1} className='p-10 text-center text-gray-400 font-medium text-sm'>
                                                No team members found.
                                            </td>
                                        </tr>
                                    ) : (
                                        teamMembers.map(emp => (
                                            <tr key={emp._id || emp.userId} className='hover:bg-gray-50/50 transition-colors'>
                                                <td className='p-4 pl-6 font-bold text-sm text-gray-900 sticky left-0 bg-white/90 backdrop-blur z-10 shadow-[1px_0_0_0_#f3f4f6]'>
                                                    {emp.fullName || emp.name}
                                                </td>
                                                {monthDays.map(day => {
                                                    const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                                                    const report = presentMonthReports.find(r => r.employeeId === (emp._id || emp.userId) && r.date === dateStr);
                                                    
                                                    return (
                                                        <td key={day} className='p-2 align-top'>
                                                            {report ? (
                                                                <div 
                                                                    onClick={() => setSelectedReport(report)}
                                                                    title="Click to view full report"
                                                                    className={`cursor-pointer rounded-lg p-2.5 text-left border transition-colors h-full flex flex-col justify-start ${report.status === 'Submitted' ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50/50 border-amber-100 hover:bg-amber-100'}`}
                                                                >
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                                                        <span className={report.status === 'Submitted' ? 'text-emerald-700' : 'text-amber-700'}>{report.status}</span>
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                                                                        {report.status === 'Submitted' 
                                                                            ? report.eveningUpdate || <span className="italic">No update text</span>
                                                                            : <div dangerouslySetInnerHTML={{ __html: report.morningPlan }} />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ) : isOnLeave(emp, dateStr) ? (
                                                                <div className="h-full flex items-center justify-center">
                                                                    <div className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                                        On Leave
                                                                    </div>
                                                                </div>
                                                            ) : isWeekend(dateStr) ? (
                                                                <div className="h-full flex items-center justify-center">
                                                                    <div className="bg-gray-50 text-gray-400 border border-gray-100 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                                        Weekend
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex items-center justify-center text-gray-300">-</div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {selectedReport && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedReport.employeeName || 'Unknown Employee'} - EOD Report</h3>
                                <p className="text-sm text-gray-500 font-medium">{selectedReport.date}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Day Plan
                                </h4>
                                <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4 text-sm text-gray-700 prose prose-sm max-w-none prose-ul:my-1 prose-li:my-0.5" dangerouslySetInnerHTML={{ __html: selectedReport.morningPlan }} />
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> EOD
                                </h4>
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-medium">
                                    {selectedReport.eveningUpdate || <span className="italic text-gray-400">No EOD submitted yet.</span>}
                                </div>
                            </div>

                            {selectedReport.blockers && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Challenges / Issues
                                    </h4>
                                    <div className="bg-red-50/30 border border-red-100 rounded-xl p-4 text-sm text-red-700 whitespace-pre-wrap font-medium">
                                        {selectedReport.blockers}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button onClick={() => setSelectedReport(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingReport && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingReport(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Edit EOD Report</h3>
                                <p className="text-sm text-gray-500 font-medium">{editingReport.employeeName || 'Unknown Employee'} - {editingReport.date}</p>
                            </div>
                            <button onClick={() => setEditingReport(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Day Plan</label>
                                <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                                    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 border-b border-gray-100 px-1.5 sm:px-2 py-1.5 bg-white">
                                        {btn(editor?.isActive('bold'), () => editor?.chain().focus().toggleBold().run(), "Bold", <Bold size={15} />)}
                                        {btn(editor?.isActive('italic'), () => editor?.chain().focus().toggleItalic().run(), "Italic", <Italic size={15} />)}
                                        {btn(editor?.isActive('underline'), () => editor?.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon size={15} />)}
                                        {btn(editor?.isActive('strike'), () => editor?.chain().focus().toggleStrike().run(), "Strikethrough", <Strikethrough size={15} />)}
                                        <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                                        {btn(editor?.isActive('bulletList'), () => editor?.chain().focus().toggleBulletList().run(), "Bulleted list", <List size={15} />)}
                                        {btn(editor?.isActive('orderedList'), () => editor?.chain().focus().toggleOrderedList().run(), "Numbered list", <ListOrdered size={15} />)}
                                        {btn(editor?.isActive('taskList'), () => editor?.chain().focus().toggleTaskList().run(), "Task List", <CheckSquare size={15} />)}
                                        <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                                        {btn(false, () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), "Clear formatting", <Eraser size={15} />)}
                                        <span className="ml-auto" />
                                        {btn(false, () => editor?.chain().focus().undo().run(), "Undo", <Undo size={15} />, !editor?.can().undo())}
                                        {btn(false, () => editor?.chain().focus().redo().run(), "Redo", <Redo size={15} />, !editor?.can().redo())}
                                    </div>
                                    <div className="overflow-y-auto tiptap-content text-[14px]" style={{ minHeight: '150px', maxHeight: '40vh', color: '#1B1B18' }}>
                                        <EditorContent editor={editor} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">EOD Update</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    rows="4"
                                    value={editForm.eveningUpdate}
                                    onChange={e => setEditForm({...editForm, eveningUpdate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Challenges / Issues</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    rows="2"
                                    value={editForm.blockers}
                                    onChange={e => setEditForm({...editForm, blockers: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setEditingReport(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={handleEditSubmit} className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}