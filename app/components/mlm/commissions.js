// app/mlm/real-time-commission/page.jsx

"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY TREE USERS (matching your provided tree) ----------
// Each commission entry includes the original seller (soldBy), customer, property, sale amount, and commission earned by this user.
// Commissions flow upward only: a sale by ME gives commission to MM, SMM, AGM, DGM, GM.
// A sale by SMM gives commission to AGM, DGM, GM (not to MM or ME).
const USERS_BY_RANK = {
    // GM: earns 2.5% of profit from all downline sales (from ME, MM, SMM, AGM, DGM)
    GM: {
        name: "Rajesh Kumar Reddy",
        userCode: "RBZ1001",
        level: "GM",
        totalCommission: 1250.75, // sum of all commissions below
        recentCommissions: [
            // Sales by ME (Kavita, Lakshmi, Rekha, Suresh)
            { date: "2026-03-30", amount: 37.48, soldBy: "Kavita Nair (ME)", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-28", amount: 54.98, soldBy: "Lakshmi (ME)", customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 4999 },
            { date: "2026-03-25", amount: 19.98, soldBy: "Rekha (ME)", customerName: "Mr. Patel", propertyName: "Farmland - 2 acres", saleAmount: 1599 },
            { date: "2026-03-20", amount: 39.98, soldBy: "Suresh (ME)", customerName: "Mr. Khan", propertyName: "Godown - 5000 sq.ft", saleAmount: 3499 },
            // Sales by MM (Sneha, Vikram, Divya, Arjun)
            { date: "2026-03-15", amount: 112.43, soldBy: "Sneha Reddy (MM)", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
            { date: "2026-03-10", amount: 187.43, soldBy: "Vikram Singh (MM)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 4999 },
            { date: "2026-03-05", amount: 59.93, soldBy: "Divya K (MM)", customerName: "Mr. Mehta", propertyName: "Commercial Godown - 8000 sq.ft", saleAmount: 1599 },
            { date: "2026-02-28", amount: 131.18, soldBy: "Arjun Nair (MM)", customerName: "Mr. Singh", propertyName: "Open Land - 300 sq.yds", saleAmount: 3499 },
            // Sales by SMM (Neha, Rahul)
            { date: "2026-03-12", amount: 299.90, soldBy: "Neha Gupta (SMM)", customerName: "Mr. Verma", propertyName: "Luxury Villa - 500 sq.yds", saleAmount: 4999 },
            { date: "2026-03-08", amount: 224.93, soldBy: "Rahul Verma (SMM)", customerName: "Mrs. Gupta", propertyName: "Farmhouse with Land - 1.5 acres", saleAmount: 3999 },
            // Sales by AGM (Amit)
            { date: "2026-03-01", amount: 374.85, soldBy: "Amit Patel (AGM)", customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres", saleAmount: 4999 },
        ],
    },
    // DGM: earns 5% from downline (ME, MM, SMM, AGM)
    DGM: {
        name: "Priya Sharma",
        userCode: "RBZ2001",
        level: "DGM",
        totalCommission: 850.30,
        recentCommissions: [
            { date: "2026-03-30", amount: 74.95, soldBy: "Kavita Nair (ME)", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-28", amount: 124.95, soldBy: "Lakshmi (ME)", customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 4999 },
            { date: "2026-03-25", amount: 39.95, soldBy: "Rekha (ME)", customerName: "Mr. Patel", propertyName: "Farmland - 2 acres", saleAmount: 1599 },
            { date: "2026-03-20", amount: 87.45, soldBy: "Suresh (ME)", customerName: "Mr. Khan", propertyName: "Godown - 5000 sq.ft", saleAmount: 3499 },
            { date: "2026-03-15", amount: 224.85, soldBy: "Sneha Reddy (MM)", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
            { date: "2026-03-10", amount: 374.85, soldBy: "Vikram Singh (MM)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 4999 },
        ],
    },
    // AGM: earns 7.5% from downline (ME, MM, SMM)
    AGM: {
        name: "Amit Patel",
        userCode: "RBZ3001",
        level: "AGM",
        totalCommission: 1100.25,
        recentCommissions: [
            { date: "2026-03-30", amount: 112.43, soldBy: "Kavita Nair (ME)", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-28", amount: 187.43, soldBy: "Lakshmi (ME)", customerName: "Mrs. Reddy", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 4999 },
            { date: "2026-03-15", amount: 224.85, soldBy: "Sneha Reddy (MM)", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
            { date: "2026-03-10", amount: 374.85, soldBy: "Vikram Singh (MM)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 4999 },
            { date: "2026-03-12", amount: 299.90, soldBy: "Neha Gupta (SMM)", customerName: "Mr. Verma", propertyName: "Luxury Villa - 500 sq.yds", saleAmount: 4999 },
        ],
    },
    // SMM: earns 10% from downline (ME, MM) + own sales (self)
    SMM: {
        name: "Neha Gupta",
        userCode: "RBZ3002",
        level: "SMM",
        totalCommission: 750.00,
        recentCommissions: [
            { date: "2026-03-30", amount: 149.90, soldBy: "Kavita Nair (ME)", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-15", amount: 224.85, soldBy: "Sneha Reddy (MM)", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
            { date: "2026-03-10", amount: 374.85, soldBy: "Vikram Singh (MM)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 4999 },
        ],
    },
    // MM: earns 15% from downline (ME) + own sales (self)
    MM: {
        name: "Sneha Reddy",
        userCode: "RBZ4001",
        level: "MM",
        totalCommission: 600.00,
        recentCommissions: [
            { date: "2026-03-30", amount: 224.85, soldBy: "Kavita Nair (ME)", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-15", amount: 374.85, soldBy: "Self sale", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
        ],
    },
    // ME: earns 50% from own sales (no downline)
    ME: {
        name: "Kavita Nair",
        userCode: "RBZ5001",
        level: "ME",
        totalCommission: 749.50,
        recentCommissions: [
            { date: "2026-03-30", amount: 749.50, soldBy: "Self sale", customerName: "Mr. Sharma", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
        ],
    },
};

// Alternate users (same structure, but with different names and properties)
const ALTERNATE_USERS = {
    DGM2: {
        name: "Vijay Malhotra",
        userCode: "RBZ2002",
        level: "DGM",
        totalCommission: 950.00,
        recentCommissions: [
            { date: "2026-03-29", amount: 74.95, soldBy: "Pooja Desai (SMM)", customerName: "Mr. Verma", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 2999 },
            { date: "2026-03-27", amount: 124.95, soldBy: "Ravi Shankar (SMM)", customerName: "Mrs. Gupta", propertyName: "Luxury Villa - 500 sq.yds", saleAmount: 4999 },
            { date: "2026-03-22", amount: 39.95, soldBy: "Deepa Nair (SMM)", customerName: "Mr. Yadav", propertyName: "Open Land - 120 sq.yds", saleAmount: 1599 },
            { date: "2026-03-18", amount: 87.45, soldBy: "Lakshmi (ME)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 3499 },
            { date: "2026-03-12", amount: 224.85, soldBy: "Kiran (Pending)", customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-05", amount: 374.85, soldBy: "Teja (Pending)", customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres", saleAmount: 4999 },
        ],
    },
    AGM2: {
        name: "Anjali Mehta",
        userCode: "RBZ3004",
        level: "AGM",
        totalCommission: 1100.00,
        recentCommissions: [
            { date: "2026-03-29", amount: 112.43, soldBy: "Pooja Desai (SMM)", customerName: "Mr. Verma", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 2999 },
            { date: "2026-03-27", amount: 187.43, soldBy: "Ravi Shankar (SMM)", customerName: "Mrs. Gupta", propertyName: "Luxury Villa - 500 sq.yds", saleAmount: 4999 },
            { date: "2026-03-22", amount: 59.93, soldBy: "Deepa Nair (SMM)", customerName: "Mr. Yadav", propertyName: "Open Land - 120 sq.yds", saleAmount: 1599 },
            { date: "2026-03-18", amount: 131.18, soldBy: "Lakshmi (ME)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 3499 },
            { date: "2026-03-12", amount: 224.85, soldBy: "Kiran (Pending)", customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
            { date: "2026-03-05", amount: 374.85, soldBy: "Teja (Pending)", customerName: "Mr. Reddy", propertyName: "Agricultural Land - 3 acres", saleAmount: 4999 },
        ],
    },
    SMM2: {
        name: "Pooja Desai",
        userCode: "RBZ4005",
        level: "SMM",
        totalCommission: 600.00,
        recentCommissions: [
            { date: "2026-03-29", amount: 149.90, soldBy: "Lakshmi (ME)", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 2999 },
            { date: "2026-03-22", amount: 224.85, soldBy: "Self sale", customerName: "Mr. Verma", propertyName: "Corner Plot - 200 sq.yds", saleAmount: 2999 },
            { date: "2026-03-15", amount: 224.85, soldBy: "Kiran (Pending)", customerName: "Mr. Nair", propertyName: "Premium Villa - 300 sq.yds", saleAmount: 2999 },
        ],
    },
    MM2: {
        name: "Vikram Singh",
        userCode: "RBZ4002",
        level: "MM",
        totalCommission: 450.00,
        recentCommissions: [
            { date: "2026-03-10", amount: 224.85, soldBy: "Rohan Das (Pending)", customerName: "Mr. Das", propertyName: "Budget Plot - 100 sq.yds", saleAmount: 2999 },
            { date: "2026-03-02", amount: 224.85, soldBy: "Self sale", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 2999 },
        ],
    },
    ME2: {
        name: "Lakshmi",
        userCode: "RBZ5002",
        level: "ME",
        totalCommission: 1249.50,
        recentCommissions: [
            { date: "2026-03-28", amount: 1249.50, soldBy: "Self sale", customerName: "Mrs. Bose", propertyName: "Small Farmland - 0.5 acres", saleAmount: 4999 },
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
                    <h1 className="text-3xl font-bold text-gray-800">Commission Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Click any rank to see commission details – based on the MLM chain (ME → MM → SMM → AGM → DGM → GM)
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        ✅ Commissions flow <strong>upward only</strong>: higher ranks earn from downline sales; lower ranks do not earn from upline sales.
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
                            <p className="text-sm font-semibold text-indigo-800 mb-2">📊 How Commission Flows (Upward Only)</p>
                            <div className="text-xs text-gray-700 space-y-1">
                                <p>• When an <strong>ME</strong> makes a sale: ME gets 50%, MM 15%, SMM 10%, AGM 7.5%, DGM 5%, GM 2.5%.</p>
                                <p>• When an <strong>MM</strong> makes a sale: MM gets 15%, SMM 10%, AGM 7.5%, DGM 5%, GM 2.5% (ME gets nothing).</p>
                                <p>• When an <strong>SMM</strong> makes a sale: SMM gets 10%, AGM 7.5%, DGM 5%, GM 2.5% (MM and ME get nothing).</p>
                                <p>• Higher ranks earn from <strong>downline</strong> sales only; lower ranks never earn from upline sales.</p>
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
                                    <p className="text-xs text-gray-500">from <strong>downline</strong> sales (or own sales for ME/MM/SMM)</p>
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
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.soldBy}</td>
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