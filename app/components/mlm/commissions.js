// app/mlm/real-time-commission/page.jsx

"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY TREE USERS (matching your provided tree) ----------
// Each user object now includes `selfCommission` and `downlineCommission` for demo.
// The `recentCommissions` array uses `from` field to indicate source.
const USERS_BY_RANK = {
    GM: {
        name: "Rajesh Kumar Reddy",
        userCode: "RBZ1001",
        level: "GM",
        totalCommission: 305.84,
        selfCommission: 0,        // GM has no self sales in this demo
        downlineCommission: 305.84,
        recentCommissions: [
            { date: "2026-03-30", amount: 37.48, from: "Kavita Nair (ME)", saleAmount: 2999, type: "downline" },
            { date: "2026-03-28", amount: 54.98, from: "Lakshmi (ME)", saleAmount: 4999, type: "downline" },
            { date: "2026-03-25", amount: 19.98, from: "Rekha (ME)", saleAmount: 1599, type: "downline" },
            { date: "2026-03-20", amount: 39.98, from: "Suresh (ME)", saleAmount: 3499, type: "downline" },
            { date: "2026-03-15", amount: 37.48, from: "Sneha Reddy (MM)", saleAmount: 2999, type: "downline" },
            { date: "2026-03-10", amount: 54.98, from: "Vikram Singh (MM)", saleAmount: 4999, type: "downline" },
            { date: "2026-03-05", amount: 19.98, from: "Divya K (MM)", saleAmount: 1599, type: "downline" },
            { date: "2026-02-28", amount: 39.98, from: "Arjun Nair (MM)", saleAmount: 3499, type: "downline" },
        ],
    },
    DGM: {
        name: "Priya Sharma",
        userCode: "RBZ2001",
        level: "DGM",
        totalCommission: 327.30,
        selfCommission: 0,
        downlineCommission: 327.30,
        recentCommissions: [
            { date: "2026-03-30", amount: 74.95, from: "Kavita Nair (ME)", saleAmount: 2999, type: "downline" },
            { date: "2026-03-28", amount: 124.95, from: "Lakshmi (ME)", saleAmount: 4999, type: "downline" },
            { date: "2026-03-25", amount: 39.95, from: "Rekha (ME)", saleAmount: 1599, type: "downline" },
            { date: "2026-03-20", amount: 87.45, from: "Suresh (ME)", saleAmount: 3499, type: "downline" },
        ],
    },
    AGM: {
        name: "Amit Patel",
        userCode: "RBZ3001",
        level: "AGM",
        totalCommission: 299.86,
        selfCommission: 0,
        downlineCommission: 299.86,
        recentCommissions: [
            { date: "2026-03-30", amount: 112.43, from: "Kavita Nair (ME)", saleAmount: 2999, type: "downline" },
            { date: "2026-03-28", amount: 187.43, from: "Lakshmi (ME)", saleAmount: 4999, type: "downline" },
        ],
    },
    SMM: {
        name: "Neha Gupta",
        userCode: "RBZ3002",
        level: "SMM",
        totalCommission: 149.90,
        selfCommission: 0,
        downlineCommission: 149.90,
        recentCommissions: [
            { date: "2026-03-30", amount: 149.90, from: "Kavita Nair (ME)", saleAmount: 2999, type: "downline" },
        ],
    },
    MM: {
        name: "Sneha Reddy",
        userCode: "RBZ4001",
        level: "MM",
        totalCommission: 224.85,
        selfCommission: 0,
        downlineCommission: 224.85,
        recentCommissions: [
            { date: "2026-03-15", amount: 224.85, from: "Rohan Das (Pending)", saleAmount: 2999, type: "downline" },
        ],
    },
    ME: {
        name: "Kavita Nair",
        userCode: "RBZ5001",
        level: "ME",
        totalCommission: 749.50,
        selfCommission: 749.50,   // ME earns from own sales
        downlineCommission: 0,
        recentCommissions: [
            { date: "2026-03-30", amount: 749.50, from: "Self sale", saleAmount: 2999, type: "self" },
        ],
    },
};

const RANKS = ["GM", "DGM", "AGM", "SMM", "MM", "ME"];

// Helper to get commission percentage from level
const getCommissionPercentage = (level) => {
    switch (level) {
        case "GM": return 2.5;
        case "DGM": return 5;
        case "AGM": return 7.5;
        case "SMM": return 10;
        case "MM": return 15;
        case "ME": return 50;
        default: return 0;
    }
};

// Helper to get full position name
const getFullPositionName = (level) => {
    switch (level) {
        case "GM": return "General Manager";
        case "DGM": return "Deputy General Manager";
        case "AGM": return "Assistant General Manager";
        case "SMM": return "Senior Master Member";
        case "MM": return "Master Member";
        case "ME": return "Member";
        default: return "";
    }
};

export default function RealTimeCommission() {
    const [selectedRank, setSelectedRank] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const handleRankClick = (rank) => {
        if (selectedRank === rank) {
            setSelectedRank(null);
            setCurrentUser(null);
        } else {
            setSelectedRank(rank);
            setCurrentUser(USERS_BY_RANK[rank]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Real‑Time Commission Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Click any rank to see a real user's commission details (dummy data)
                    </p>
                </div>

                {/* Rank Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {RANKS.map((rank) => (
                        <button
                            key={rank}
                            onClick={() => handleRankClick(rank)}
                            className={`px-6 py-2 rounded-full font-bold transition-all shadow-sm ${selectedRank === rank
                                    ? "bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-400"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {rank}
                        </button>
                    ))}
                </div>

                {/* Commission Details for Selected User */}
                {currentUser && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* User Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                                    <p className="text-blue-100 mt-1">
                                        {currentUser.level} · User Code: {currentUser.userCode}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm opacity-90">Total Commission Earned</div>
                                    <div className="text-3xl font-bold">{formatCurrency(currentUser.totalCommission)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Commission Rate Card */}
                        <div className="mx-6 mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className="text-sm text-gray-600">Your Commission Rate</p>
                                    <p className="text-2xl font-bold text-amber-700">{getCommissionPercentage(currentUser.level)}%</p>
                                    <p className="text-xs text-gray-500">
                                        as a {getFullPositionName(currentUser.level)} ({currentUser.level})
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">You earn</p>
                                    <p className="text-lg font-semibold text-green-700">{getCommissionPercentage(currentUser.level)}% of profit</p>
                                    <p className="text-xs text-gray-500">on every sale (self + downline)</p>
                                </div>
                            </div>
                        </div>

                        {/* Self vs Downline Commission Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-6 mt-4">
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-700 font-medium">💰 Self Commission</p>
                                        <p className="text-xs text-green-600">From your own sales</p>
                                    </div>
                                    <div className="text-2xl font-bold text-green-700">
                                        {formatCurrency(currentUser.selfCommission || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-700 font-medium">👥 Downline Commission</p>
                                        <p className="text-xs text-blue-600">From your team's sales</p>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(currentUser.downlineCommission || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Commissions Table */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Commission Transaction History</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentUser.recentCommissions.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.from}</td>
                                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.saleAmount)}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                                                    {formatCurrency(item.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.type === "self" ? (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Self</span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Downline</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-right font-semibold">Total:</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                                {formatCurrency(currentUser.recentCommissions.reduce((sum, c) => sum + c.amount, 0))}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Mini stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-blue-600">Commission Rate</div>
                                <div className="text-xl font-bold">{getCommissionPercentage(currentUser.level)}%</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-green-600">Total Transactions</div>
                                <div className="text-xl font-bold">{currentUser.recentCommissions.length}</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-purple-600">Avg Commission</div>
                                <div className="text-xl font-bold">
                                    {formatCurrency(currentUser.totalCommission / currentUser.recentCommissions.length)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!currentUser && selectedRank === null && (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-lg shadow-md">
                        <div className="text-4xl mb-2">👆</div>
                        <p>Select a rank above to see a real user's commission data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}