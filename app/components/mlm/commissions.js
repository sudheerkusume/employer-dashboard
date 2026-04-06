// app/mlm/commissions/page.jsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY COMMISSION DATA (simulating backend) ----------
// Each entry matches the expected commission object from API
const DUMMY_COMMISSIONS_BY_USER = {
    // GM - Rajesh Kumar Reddy (RBZ1001)
    RBZ1001: [
        { _id: "comm1", createdAt: "2026-03-30T10:00:00Z", level: "GM", saleAmount: 2999, percentage: 2.5, commissionAmount: 37.48, fromUser: "RBZ5001", description: "Sale by Kavita Nair" },
        { _id: "comm2", createdAt: "2026-03-28T14:30:00Z", level: "GM", saleAmount: 4999, percentage: 2.5, commissionAmount: 54.98, fromUser: "RBZ5002", description: "Sale by Lakshmi" },
        { _id: "comm3", createdAt: "2026-03-25T09:15:00Z", level: "GM", saleAmount: 1599, percentage: 2.5, commissionAmount: 19.98, fromUser: "RBZ5003", description: "Sale by Rekha" },
        { _id: "comm4", createdAt: "2026-03-20T16:45:00Z", level: "GM", saleAmount: 3499, percentage: 2.5, commissionAmount: 39.98, fromUser: "RBZ5004", description: "Sale by Suresh" },
        { _id: "comm5", createdAt: "2026-03-15T11:20:00Z", level: "GM", saleAmount: 2999, percentage: 2.5, commissionAmount: 37.48, fromUser: "RBZ4001", description: "Sale by Sneha Reddy" },
        { _id: "comm6", createdAt: "2026-03-10T08:00:00Z", level: "GM", saleAmount: 4999, percentage: 2.5, commissionAmount: 54.98, fromUser: "RBZ4002", description: "Sale by Vikram Singh" },
        { _id: "comm7", createdAt: "2026-03-05T13:30:00Z", level: "GM", saleAmount: 1599, percentage: 2.5, commissionAmount: 19.98, fromUser: "RBZ4003", description: "Sale by Divya K" },
        { _id: "comm8", createdAt: "2026-02-28T09:45:00Z", level: "GM", saleAmount: 3499, percentage: 2.5, commissionAmount: 39.98, fromUser: "RBZ4004", description: "Sale by Arjun Nair" },
    ],
    // DGM - Priya Sharma (RBZ2001)
    RBZ2001: [
        { _id: "comm9", createdAt: "2026-03-30T10:00:00Z", level: "DGM", saleAmount: 2999, percentage: 5, commissionAmount: 74.95, fromUser: "RBZ5001", description: "Sale by Kavita Nair" },
        { _id: "comm10", createdAt: "2026-03-28T14:30:00Z", level: "DGM", saleAmount: 4999, percentage: 5, commissionAmount: 124.95, fromUser: "RBZ5002", description: "Sale by Lakshmi" },
        { _id: "comm11", createdAt: "2026-03-25T09:15:00Z", level: "DGM", saleAmount: 1599, percentage: 5, commissionAmount: 39.95, fromUser: "RBZ5003", description: "Sale by Rekha" },
        { _id: "comm12", createdAt: "2026-03-20T16:45:00Z", level: "DGM", saleAmount: 3499, percentage: 5, commissionAmount: 87.45, fromUser: "RBZ5004", description: "Sale by Suresh" },
    ],
    // DGM - Vijay Malhotra (RBZ2002)
    RBZ2002: [
        { _id: "comm13", createdAt: "2026-03-29T11:30:00Z", level: "DGM", saleAmount: 2999, percentage: 5, commissionAmount: 74.95, fromUser: "RBZ4005", description: "Sale by Pooja Desai" },
        { _id: "comm14", createdAt: "2026-03-27T15:20:00Z", level: "DGM", saleAmount: 4999, percentage: 5, commissionAmount: 124.95, fromUser: "RBZ4006", description: "Sale by Ravi Shankar" },
        { _id: "comm15", createdAt: "2026-03-22T10:10:00Z", level: "DGM", saleAmount: 1599, percentage: 5, commissionAmount: 39.95, fromUser: "RBZ4007", description: "Sale by Deepa Nair" },
    ],
    // AGM - Amit Patel (RBZ3001)
    RBZ3001: [
        { _id: "comm16", createdAt: "2026-03-30T10:00:00Z", level: "AGM", saleAmount: 2999, percentage: 7.5, commissionAmount: 112.43, fromUser: "RBZ5001", description: "Sale by Kavita Nair" },
        { _id: "comm17", createdAt: "2026-03-28T14:30:00Z", level: "AGM", saleAmount: 4999, percentage: 7.5, commissionAmount: 187.43, fromUser: "RBZ5002", description: "Sale by Lakshmi" },
    ],
    // AGM - Anjali Mehta (RBZ3004)
    RBZ3004: [
        { _id: "comm18", createdAt: "2026-03-29T11:30:00Z", level: "AGM", saleAmount: 2999, percentage: 7.5, commissionAmount: 112.43, fromUser: "RBZ4005", description: "Sale by Pooja Desai" },
        { _id: "comm19", createdAt: "2026-03-27T15:20:00Z", level: "AGM", saleAmount: 4999, percentage: 7.5, commissionAmount: 187.43, fromUser: "RBZ4006", description: "Sale by Ravi Shankar" },
    ],
    // SMM - Neha Gupta (RBZ3002)
    RBZ3002: [
        { _id: "comm20", createdAt: "2026-03-30T10:00:00Z", level: "SMM", saleAmount: 2999, percentage: 10, commissionAmount: 149.90, fromUser: "RBZ5001", description: "Sale by Kavita Nair" },
    ],
    // SMM - Pooja Desai (RBZ4005)
    RBZ4005: [
        { _id: "comm21", createdAt: "2026-03-29T11:30:00Z", level: "SMM", saleAmount: 2999, percentage: 10, commissionAmount: 149.90, fromUser: "RBZ5002", description: "Sale by Lakshmi" },
    ],
    // MM - Sneha Reddy (RBZ4001)
    RBZ4001: [
        { _id: "comm22", createdAt: "2026-03-15T11:20:00Z", level: "MM", saleAmount: 2999, percentage: 15, commissionAmount: 224.85, fromUser: "RBZ6001", description: "Sale by Rohan Das" },
    ],
    // ME - Kavita Nair (RBZ5001)
    RBZ5001: [
        { _id: "comm23", createdAt: "2026-03-30T10:00:00Z", level: "ME", saleAmount: 2999, percentage: 50, commissionAmount: 749.50, fromUser: null, description: "Self sale" },
    ],
    // ME - Lakshmi (RBZ5002)
    RBZ5002: [
        { _id: "comm24", createdAt: "2026-03-28T14:30:00Z", level: "ME", saleAmount: 4999, percentage: 50, commissionAmount: 1249.50, fromUser: null, description: "Self sale" },
    ],
    // ME - Rekha (RBZ5003)
    RBZ5003: [
        { _id: "comm25", createdAt: "2026-03-25T09:15:00Z", level: "ME", saleAmount: 1599, percentage: 50, commissionAmount: 399.50, fromUser: null, description: "Self sale" },
    ],
    // ME - Suresh (RBZ5004)
    RBZ5004: [
        { _id: "comm26", createdAt: "2026-03-20T16:45:00Z", level: "ME", saleAmount: 3499, percentage: 50, commissionAmount: 874.50, fromUser: null, description: "Self sale" },
    ],
};

// Fallback empty array for unknown user
const getDummyCommissions = (userCode) => {
    return DUMMY_COMMISSIONS_BY_USER[userCode] || [];
};

export default function CommissionsPage() {
    const searchParams = useSearchParams();
    const [commissions, setCommissions] = useState([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userCode, setUserCode] = useState("");
    const [filter, setFilter] = useState({
        fromDate: "",
        toDate: "",
    });
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0,
    });

    // Load user code and dummy data
    useEffect(() => {
        const code = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
        if (code) {
            setUserCode(code);
            loadCommissions(code);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    // Load commissions from dummy data (with optional date filtering)
    const loadCommissions = (code, dateFilter = filter) => {
        setLoading(true);
        // Simulate async delay
        setTimeout(() => {
            let allCommissions = getDummyCommissions(code);

            // Apply date filters
            if (dateFilter.fromDate) {
                const from = new Date(dateFilter.fromDate);
                allCommissions = allCommissions.filter(c => new Date(c.createdAt) >= from);
            }
            if (dateFilter.toDate) {
                const to = new Date(dateFilter.toDate);
                to.setHours(23, 59, 59, 999);
                allCommissions = allCommissions.filter(c => new Date(c.createdAt) <= to);
            }

            // Sort by date descending (newest first)
            allCommissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const total = allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
            setCommissions(allCommissions);
            setTotalCommission(total);
            calculateStats(allCommissions);
            setLoading(false);
        }, 300); // simulate network delay
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
            month: monthTotal,
        });
    };

    const handleFilterChange = (e) => {
        setFilter({
            ...filter,
            [e.target.name]: e.target.value,
        });
    };

    const applyFilter = () => {
        if (userCode) {
            loadCommissions(userCode, filter);
        }
    };

    const resetFilter = () => {
        const emptyFilter = { fromDate: "", toDate: "" };
        setFilter(emptyFilter);
        if (userCode) {
            loadCommissions(userCode, emptyFilter);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="bg-white text-gray-900 w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Commission History</h1>
                    <p className="text-gray-600 mt-2">
                        User: <span className="font-semibold">{userCode || "Not specified"}</span>
                    </p>
                    <p className="text-gray-600">
                        Total Commission Earned:{" "}
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</span>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From / Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${commission.level === "GM"
                                                            ? "bg-red-100 text-red-700"
                                                            : commission.level === "DGM"
                                                                ? "bg-orange-100 text-orange-700"
                                                                : commission.level === "AGM"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : commission.level === "SMM"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : commission.level === "MM"
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : "bg-purple-100 text-purple-700"
                                                        }`}
                                                >
                                                    {commission.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatCurrency(commission.saleAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{commission.percentage}%</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                                {formatCurrency(commission.commissionAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {commission.fromUser ? `User: ${commission.fromUser}` : "Self sale"}<br />
                                                <span className="text-xs">{commission.description}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {commissions.length > 0 && (
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="4" className="px-6 py-3 text-right font-semibold">
                                            Total:
                                        </td>
                                        <td className="px-6 py-3 font-bold text-green-600">
                                            {formatCurrency(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Note about dummy data */}
                <div className="mt-4 text-xs text-gray-400 text-center border-t pt-4">
                    <p>📊 Showing dummy commission data for demonstration. No backend calls are made.</p>
                    <p>✅ Filtering, stats, and totals work entirely client-side on the dummy dataset.</p>
                </div>
            </div>
        </div>
    );
}