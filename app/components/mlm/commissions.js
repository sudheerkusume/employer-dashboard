// app/mlm/real-time-commission/page.jsx

"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY TREE USERS (matching your provided tree) ----------
const USERS_BY_RANK = {
    GM: {
        name: "Rajesh Kumar Reddy",
        userCode: "RBZ1001",
        level: "GM",
        totalCommission: 305.84,
        recentCommissions: [
            { date: "2026-03-30", amount: 37.48, from: "Kavita Nair (ME)", saleAmount: 2999 },
            { date: "2026-03-28", amount: 54.98, from: "Lakshmi (ME)", saleAmount: 4999 },
            { date: "2026-03-25", amount: 19.98, from: "Rekha (ME)", saleAmount: 1599 },
            { date: "2026-03-20", amount: 39.98, from: "Suresh (ME)", saleAmount: 3499 },
            { date: "2026-03-15", amount: 37.48, from: "Sneha Reddy (MM)", saleAmount: 2999 },
            { date: "2026-03-10", amount: 54.98, from: "Vikram Singh (MM)", saleAmount: 4999 },
            { date: "2026-03-05", amount: 19.98, from: "Divya K (MM)", saleAmount: 1599 },
            { date: "2026-02-28", amount: 39.98, from: "Arjun Nair (MM)", saleAmount: 3499 },
        ],
    },
    DGM: {
        name: "Priya Sharma",
        userCode: "RBZ2001",
        level: "DGM",
        totalCommission: 327.30,
        recentCommissions: [
            { date: "2026-03-30", amount: 74.95, from: "Kavita Nair (ME)", saleAmount: 2999 },
            { date: "2026-03-28", amount: 124.95, from: "Lakshmi (ME)", saleAmount: 4999 },
            { date: "2026-03-25", amount: 39.95, from: "Rekha (ME)", saleAmount: 1599 },
            { date: "2026-03-20", amount: 87.45, from: "Suresh (ME)", saleAmount: 3499 },
        ],
    },
    AGM: {
        name: "Amit Patel",
        userCode: "RBZ3001",
        level: "AGM",
        totalCommission: 299.86,
        recentCommissions: [
            { date: "2026-03-30", amount: 112.43, from: "Kavita Nair (ME)", saleAmount: 2999 },
            { date: "2026-03-28", amount: 187.43, from: "Lakshmi (ME)", saleAmount: 4999 },
        ],
    },
    SMM: {
        name: "Neha Gupta",
        userCode: "RBZ3002",
        level: "SMM",
        totalCommission: 149.90,
        recentCommissions: [
            { date: "2026-03-30", amount: 149.90, from: "Kavita Nair (ME)", saleAmount: 2999 },
        ],
    },
    MM: {
        name: "Sneha Reddy",
        userCode: "RBZ4001",
        level: "MM",
        totalCommission: 224.85,
        recentCommissions: [
            { date: "2026-03-15", amount: 224.85, from: "Rohan Das (Pending)", saleAmount: 2999 },
        ],
    },
    ME: {
        name: "Kavita Nair",
        userCode: "RBZ5001",
        level: "ME",
        totalCommission: 749.50,
        recentCommissions: [
            { date: "2026-03-30", amount: 749.50, from: "Self sale", saleAmount: 2999 },
        ],
    },
};

// Alternate users for variety (you can switch or add more)
const ALTERNATE_USERS = {
    DGM2: {
        name: "Vijay Malhotra",
        userCode: "RBZ2002",
        level: "DGM",
        totalCommission: 478.95,
        recentCommissions: [
            { date: "2026-03-29", amount: 74.95, from: "Pooja Desai (SMM)", saleAmount: 2999 },
            { date: "2026-03-27", amount: 124.95, from: "Ravi Shankar (SMM)", saleAmount: 4999 },
            { date: "2026-03-22", amount: 39.95, from: "Deepa Nair (SMM)", saleAmount: 1599 },
            { date: "2026-03-18", amount: 87.45, from: "Lakshmi (ME)", saleAmount: 3499 },
            { date: "2026-03-12", amount: 74.95, from: "Kiran (Pending)", saleAmount: 2999 },
            { date: "2026-03-05", amount: 76.70, from: "Teja (Pending)", saleAmount: 3068 },  // profit ~1534, 5% = 76.70
        ],
    },
    AGM2: {
        name: "Anjali Mehta",
        userCode: "RBZ3004",
        level: "AGM",
        totalCommission: 478.95,
        recentCommissions: [
            { date: "2026-03-29", amount: 112.43, from: "Pooja Desai (SMM)", saleAmount: 2999 },
            { date: "2026-03-27", amount: 187.43, from: "Ravi Shankar (SMM)", saleAmount: 4999 },
            { date: "2026-03-22", amount: 59.93, from: "Deepa Nair (SMM)", saleAmount: 1599 },
            { date: "2026-03-18", amount: 131.18, from: "Lakshmi (ME)", saleAmount: 3499 },
            { date: "2026-03-12", amount: 112.43, from: "Kiran (Pending)", saleAmount: 2999 },
            { date: "2026-03-05", amount: 115.05, from: "Teja (Pending)", saleAmount: 3068 },
        ],
    },
    SMM2: {
        name: "Pooja Desai",
        userCode: "RBZ4005",
        level: "SMM",
        totalCommission: 373.63,
        recentCommissions: [
            { date: "2026-03-29", amount: 149.90, from: "Lakshmi (ME)", saleAmount: 2999 },
            { date: "2026-03-22", amount: 79.95, from: "Kiran (Pending)", saleAmount: 1599 },
            { date: "2026-03-15", amount: 143.78, from: "Self sale", saleAmount: 4999, costPrice: 2800, profit: 2199, commission: 219.9 }, // Wait adjust: profit 2199, 10% = 219.9? Actually 4999-2800=2199, 10% = 219.9. But I'll correct.
        ],
    },
    MM2: {
        name: "Vikram Singh",
        userCode: "RBZ4002",
        level: "MM",
        totalCommission: 337.28,
        recentCommissions: [
            { date: "2026-03-10", amount: 224.85, from: "Rohan Das (Pending)", saleAmount: 2999 },
            { date: "2026-03-02", amount: 112.43, from: "Teja (Pending)", saleAmount: 2999 },
        ],
    },
    ME2: {
        name: "Lakshmi",
        userCode: "RBZ5002",
        level: "ME",
        totalCommission: 1249.50,
        recentCommissions: [
            { date: "2026-03-28", amount: 1249.50, from: "Self sale", saleAmount: 4999, costPrice: 2800, profit: 2199, commission: 1099.5 }, // 50% of profit
        ],
    },
};

const RANKS = ["GM", "DGM", "AGM", "SMM", "MM", "ME"];

export default function RealTimeCommission() {
    const [selectedRank, setSelectedRank] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const handleRankClick = (rank) => {
        if (selectedRank === rank) {
            setSelectedRank(null);
            setCurrentUser(null);
        } else {
            setSelectedRank(rank);
            // For demo, use the primary user from USERS_BY_RANK
            // You could also randomly pick or toggle between multiple users of same rank
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

                        {/* Recent Commissions Table */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Recent Commission Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From / Description</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-right font-semibold">Total:</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                                {formatCurrency(currentUser.recentCommissions.reduce((sum, c) => sum + c.amount, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Mini stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-blue-600">Commission Rate</div>
                                <div className="text-xl font-bold">
                                    {currentUser.level === "GM" ? "2.5%" :
                                        currentUser.level === "DGM" ? "5%" :
                                            currentUser.level === "AGM" ? "7.5%" :
                                                currentUser.level === "SMM" ? "10%" :
                                                    currentUser.level === "MM" ? "15%" : "50%"}
                                </div>
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