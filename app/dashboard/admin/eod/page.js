'use client';
import { useState, useEffect } from 'react';
import { formatDateTime } from "@/app/components/config/sitesettings";
import Loading from "@/app/components/common/loading";

export default function AdminEODPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // Fetching all reports for the admin
            const res = await fetch('/api/eod?role=admin'); 
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">End of Day Reports</h1>
                    <p className="text-gray-500 mt-1">Review daily submissions from all employees.</p>
                </div>
                <button onClick={fetchReports} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition">
                    Refresh
                </button>
            </div>
            
            {loading ? (
                <Loading />
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="p-4 pl-6">Date</th>
                                    <th className="p-4">Employee</th>
                                    <th className="p-4">Department</th>
                                    <th className="p-4">Morning Plan</th>
                                    <th className="p-4">Evening Update</th>
                                    <th className="p-4 pr-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400">
                                            No reports found.
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 pl-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {report.date}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900">{report.employeeName}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {report.department || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={report.morningPlan}>
                                                {report.morningPlan}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={report.eveningUpdate}>
                                                {report.eveningUpdate || 'Not updated yet'}
                                            </td>
                                            <td className="p-4 pr-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    report.status === 'Submitted' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
