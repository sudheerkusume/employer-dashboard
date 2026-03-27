// app/mlm/commissions/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

export default function CommissionsPage() {
    const searchParams = useSearchParams();
    const [commissions, setCommissions] = useState([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userCode, setUserCode] = useState("");
    const [filter, setFilter] = useState({
        fromDate: "",
        toDate: ""
    });
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0
    });

    useEffect(() => {
        const code = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
        if (code) {
            setUserCode(code);
            fetchCommissions(code);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const fetchCommissions = async (code) => {
        try {
            setLoading(true);
            let url = `/api/mlm/commission?userCode=${code}&limit=100`;

            if (filter.fromDate) url += `&fromDate=${filter.fromDate}`;
            if (filter.toDate) url += `&toDate=${filter.toDate}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setCommissions(data.commissions);
                setTotalCommission(data.totalCommission);
                calculateStats(data.commissions);
            }
        } catch (err) {
            console.log("Error fetching commissions:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (commissionsData) => {
        const today = new Date().toDateString();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const todayTotal = commissionsData
            .filter(c => new Date(c.createdAt).toDateString() === today)
            .reduce((sum, c) => sum + c.commissionAmount, 0);

        const weekTotal = commissionsData
            .filter(c => new Date(c.createdAt) >= weekAgo)
            .reduce((sum, c) => sum + c.commissionAmount, 0);

        const monthTotal = commissionsData
            .filter(c => new Date(c.createdAt) >= monthAgo)
            .reduce((sum, c) => sum + c.commissionAmount, 0);

        setStats({
            today: todayTotal,
            week: weekTotal,
            month: monthTotal
        });
    };

    const handleFilterChange = (e) => {
        setFilter({
            ...filter,
            [e.target.name]: e.target.value
        });
    };

    const applyFilter = () => {
        if (userCode) {
            fetchCommissions(userCode);
        }
    };

    const resetFilter = () => {
        setFilter({ fromDate: "", toDate: "" });
        if (userCode) {
            fetchCommissions(userCode);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="bg-white text-gray-900 w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Commission History</h1>
                    <p className="text-gray-600 mt-2">
                        User: <span className="font-semibold">{userCode}</span>
                    </p>
                    <p className="text-gray-600">
                        Total Commission Earned: <span className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</span>
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-4">
                        <div className="text-sm opacity-90">Today's Commission</div>
                        <div className="text-2xl font-bold">{formatCurrency(stats.today)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-4">
                        <div className="text-sm opacity-90">This Week</div>
                        <div className="text-2xl font-bold">{formatCurrency(stats.week)}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-4">
                        <div className="text-sm opacity-90">This Month</div>
                        <div className="text-2xl font-bold">{formatCurrency(stats.month)}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <h3 className="font-semibold mb-3">Filter Commissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">From Date</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={filter.fromDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To Date</label>
                            <input
                                type="date"
                                name="toDate"
                                value={filter.toDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                            <button
                                onClick={applyFilter}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={resetFilter}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Commissions Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission %</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No commissions found
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map((commission) => (
                                        <tr key={commission._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {new Date(commission.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${commission.level === 'GM' ? 'bg-red-100 text-red-700' :
                                                    commission.level === 'DGM' ? 'bg-orange-100 text-orange-700' :
                                                        commission.level === 'AGM' ? 'bg-yellow-100 text-yellow-700' :
                                                            commission.level === 'SMM' ? 'bg-green-100 text-green-700' :
                                                                commission.level === 'MM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {commission.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatCurrency(commission.saleAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {commission.percentage}%
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                                {formatCurrency(commission.commissionAmount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {commissions.length > 0 && (
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="4" className="px-6 py-3 text-right font-semibold">Total:</td>
                                        <td className="px-6 py-3 font-bold text-green-600">
                                            {formatCurrency(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}