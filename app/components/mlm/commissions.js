// app/mlm/real-time-commission/page.jsx

"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY TREE USERS (matching your provided tree) ----------
// Each commission entry now includes: customerName, propertyName, originalSeller (the downline member who made the sale)
const USERS_BY_RANK = {
    GM: {
        name: "Rajesh Kumar Reddy",
        userCode: "RBZ1001",
        level: "GM",
        totalCommission: 305.84,
        recentCommissions: [
            { date: "2026-03-30", amount: 37.48, from: "Kavita Nair (ME)", saleAmount: 2999, customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-28", amount: 54.98, from: "Lakshmi (ME)", saleAmount: 4999, customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds" },
            { date: "2026-03-25", amount: 19.98, from: "Rekha (ME)", saleAmount: 1599, customerName: "Mr. Patel", propertyName: "Farmland - 2 acres" },
            { date: "2026-03-20", amount: 39.98, from: "Suresh (ME)", saleAmount: 3499, customerName: "Mr. Khan", propertyName: "Godown - 5000 sq.ft" },
            { date: "2026-03-15", amount: 37.48, from: "Sneha Reddy (MM)", saleAmount: 2999, customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds" },
            { date: "2026-03-10", amount: 54.98, from: "Vikram Singh (MM)", saleAmount: 4999, customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres" },
            { date: "2026-03-05", amount: 19.98, from: "Divya K (MM)", saleAmount: 1599, customerName: "Mr. Mehta", propertyName: "Commercial Godown - 8000 sq.ft" },
            { date: "2026-02-28", amount: 39.98, from: "Arjun Nair (MM)", saleAmount: 3499, customerName: "Mr. Singh", propertyName: "Open Land - 300 sq.yds" },
        ],
    },
    DGM: {
        name: "Priya Sharma",
        userCode: "RBZ2001",
        level: "DGM",
        totalCommission: 327.30,
        recentCommissions: [
            { date: "2026-03-30", amount: 74.95, from: "Kavita Nair (ME)", saleAmount: 2999, customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-28", amount: 124.95, from: "Lakshmi (ME)", saleAmount: 4999, customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds" },
            { date: "2026-03-25", amount: 39.95, from: "Rekha (ME)", saleAmount: 1599, customerName: "Mr. Patel", propertyName: "Farmland - 2 acres" },
            { date: "2026-03-20", amount: 87.45, from: "Suresh (ME)", saleAmount: 3499, customerName: "Mr. Khan", propertyName: "Godown - 5000 sq.ft" },
        ],
    },
    AGM: {
        name: "Amit Patel",
        userCode: "RBZ3001",
        level: "AGM",
        totalCommission: 299.86,
        recentCommissions: [
            { date: "2026-03-30", amount: 112.43, from: "Kavita Nair (ME)", saleAmount: 2999, customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-28", amount: 187.43, from: "Lakshmi (ME)", saleAmount: 4999, customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds" },
        ],
    },
    SMM: {
        name: "Neha Gupta",
        userCode: "RBZ3002",
        level: "SMM",
        totalCommission: 149.90,
        recentCommissions: [
            { date: "2026-03-30", amount: 149.90, from: "Kavita Nair (ME)", saleAmount: 2999, customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds" },
        ],
    },
    MM: {
        name: "Sneha Reddy",
        userCode: "RBZ4001",
        level: "MM",
        totalCommission: 224.85,
        recentCommissions: [
            { date: "2026-03-15", amount: 224.85, from: "Rohan Das (Pending)", saleAmount: 2999, customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds" },
        ],
    },
    ME: {
        name: "Kavita Nair",
        userCode: "RBZ5001",
        level: "ME",
        totalCommission: 749.50,
        recentCommissions: [
            { date: "2026-03-30", amount: 749.50, from: "Self sale", saleAmount: 2999, customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds" },
        ],
    },
};

// Alternate users (same structure)
const ALTERNATE_USERS = {
    DGM2: {
        name: "Vijay Malhotra",
        userCode: "RBZ2002",
        level: "DGM",
        totalCommission: 478.95,
        recentCommissions: [
            { date: "2026-03-29", amount: 74.95, from: "Pooja Desai (SMM)", saleAmount: 2999, customerName: "Mr. Verma", propertyName: "Corner Plot - 200 sq.yds" },
            { date: "2026-03-27", amount: 124.95, from: "Ravi Shankar (SMM)", saleAmount: 4999, customerName: "Mrs. Gupta", propertyName: "Luxury Villa - 500 sq.yds" },
            { date: "2026-03-22", amount: 39.95, from: "Deepa Nair (SMM)", saleAmount: 1599, customerName: "Mr. Yadav", propertyName: "Open Land - 120 sq.yds" },
            { date: "2026-03-18", amount: 87.45, from: "Lakshmi (ME)", saleAmount: 3499, customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres" },
            { date: "2026-03-12", amount: 74.95, from: "Kiran (Pending)", saleAmount: 2999, customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-05", amount: 76.70, from: "Teja (Pending)", saleAmount: 3068, customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres" },
        ],
    },
    AGM2: {
        name: "Anjali Mehta",
        userCode: "RBZ3004",
        level: "AGM",
        totalCommission: 478.95,
        recentCommissions: [
            { date: "2026-03-29", amount: 112.43, from: "Pooja Desai (SMM)", saleAmount: 2999, customerName: "Mr. Verma", propertyName: "Corner Plot - 200 sq.yds" },
            { date: "2026-03-27", amount: 187.43, from: "Ravi Shankar (SMM)", saleAmount: 4999, customerName: "Mrs. Gupta", propertyName: "Luxury Villa - 500 sq.yds" },
            { date: "2026-03-22", amount: 59.93, from: "Deepa Nair (SMM)", saleAmount: 1599, customerName: "Mr. Yadav", propertyName: "Open Land - 120 sq.yds" },
            { date: "2026-03-18", amount: 131.18, from: "Lakshmi (ME)", saleAmount: 3499, customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres" },
            { date: "2026-03-12", amount: 112.43, from: "Kiran (Pending)", saleAmount: 2999, customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-05", amount: 115.05, from: "Teja (Pending)", saleAmount: 3068, customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres" },
        ],
    },
    SMM2: {
        name: "Pooja Desai",
        userCode: "RBZ4005",
        level: "SMM",
        totalCommission: 373.63,
        recentCommissions: [
            { date: "2026-03-29", amount: 149.90, from: "Lakshmi (ME)", saleAmount: 2999, customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres" },
            { date: "2026-03-22", amount: 79.95, from: "Kiran (Pending)", saleAmount: 1599, customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds" },
            { date: "2026-03-15", amount: 143.78, from: "Self sale", saleAmount: 4999, customerName: "Mr. Mehta", propertyName: "Commercial Godown - 8000 sq.ft" },
        ],
    },
    MM2: {
        name: "Vikram Singh",
        userCode: "RBZ4002",
        level: "MM",
        totalCommission: 337.28,
        recentCommissions: [
            { date: "2026-03-10", amount: 224.85, from: "Rohan Das (Pending)", saleAmount: 2999, customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds" },
            { date: "2026-03-02", amount: 112.43, from: "Teja (Pending)", saleAmount: 2999, customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres" },
        ],
    },
    ME2: {
        name: "Lakshmi",
        userCode: "RBZ5002",
        level: "ME",
        totalCommission: 1249.50,
        recentCommissions: [
            { date: "2026-03-28", amount: 1249.50, from: "Self sale", saleAmount: 4999, customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres" },
        ],
    },
};

const RANKS = ["GM", "DGM", "AGM", "SMM", "MM", "ME"];

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
                        Click any rank to see commission details – based on the MLM chain (ME → MM → SMM → AGM → DGM → GM)
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

                        {/* Commission Chain Explanation Card */}
                        <div className="mx-6 mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-lg p-4 shadow-sm">
                            <p className="text-sm font-semibold text-indigo-800 mb-2">📊 How Commission Flows (Chain System)</p>
                            <div className="text-xs text-gray-700 space-y-1">
                                <p>• When an <strong>ME</strong> makes a sale, <strong>50%</strong> of the profit goes to the ME, <strong>15%</strong> to the MM, <strong>10%</strong> to the SMM, <strong>7.5%</strong> to the AGM, <strong>5%</strong> to the DGM, and <strong>2.5%</strong> to the GM.</p>
                                <p>• Each rank in the upline receives their fixed percentage of the profit from every downline sale.</p>
                                <p>• The table below shows commissions you earned from sales made by your downline members (or your own sales).</p>
                            </div>
                        </div>

                        {/* Commission Rate Card */}
                        <div className="mx-6 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
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
                                    <p className="text-xs text-gray-500">on every sale in your downline</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Commissions Table - Now includes Customer & Property */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏠 Real Estate Commission Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer (Party)</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold By</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Your Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentUser.recentCommissions.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.customerName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.propertyName}</td>
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
                                            <td colSpan="5" className="px-4 py-3 text-right font-semibold">Total Commission:</td>
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