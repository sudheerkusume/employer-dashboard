// app/mlm/commission-structure/page.jsx

"use client";

import { useState } from "react";

// Commission data for each rank
const COMMISSION_DATA = {
    GM: {
        fullName: "General Manager",
        percentage: 2.5,
        description: "Top-level leadership, oversees entire region.",
        note: "Receives 2.5% of the profit difference from all downline sales.",
        color: "bg-red-100 border-red-300 text-red-800",
        buttonColor: "bg-red-600 hover:bg-red-700",
        icon: "👑",
    },
    DGM: {
        fullName: "Deputy General Manager",
        percentage: 5,
        description: "Senior management, handles multiple teams.",
        note: "Receives 5% of the profit difference from sales in their downline.",
        color: "bg-orange-100 border-orange-300 text-orange-800",
        buttonColor: "bg-orange-600 hover:bg-orange-700",
        icon: "⭐",
    },
    AGM: {
        fullName: "Assistant General Manager",
        percentage: 7.5,
        description: "Manages regional operations and teams.",
        note: "Receives 7.5% of the profit difference from downline sales.",
        color: "bg-yellow-100 border-yellow-300 text-yellow-800",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        icon: "🌟",
    },
    SMM: {
        fullName: "Senior Master Member",
        percentage: 10,
        description: "Advanced leader with significant downline.",
        note: "Receives 10% of the profit difference from sales in their network.",
        color: "bg-green-100 border-green-300 text-green-800",
        buttonColor: "bg-green-600 hover:bg-green-700",
        icon: "💎",
    },
    MM: {
        fullName: "Master Member",
        percentage: 15,
        description: "Mid-level leader, building a strong team.",
        note: "Receives 15% of the profit difference from downline sales.",
        color: "bg-blue-100 border-blue-300 text-blue-800",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        icon: "🏆",
    },
    ME: {
        fullName: "Member",
        percentage: 50,
        description: "Entry-level member, starting their journey.",
        note: "Receives 50% of the profit difference from their own sales.",
        color: "bg-purple-100 border-purple-300 text-purple-800",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        icon: "🌱",
    },
};

const RANKS = ["GM", "DGM", "AGM", "SMM", "MM", "ME"];

export default function CommissionStructurePage() {
    const [selectedRank, setSelectedRank] = useState(null);

    const handleRankClick = (rank) => {
        setSelectedRank(rank === selectedRank ? null : rank);
    };

    // Calculate example commission for a given profit
    const getExampleCommission = (profit, percentage) => {
        return (profit * percentage) / 100;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">MLM Commission Structure</h1>
                    <p className="text-gray-600 mt-2">
                        Based on Profit Difference (Sale Price - Product Cost)
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Total payout: 90% of profit | Company retains: 10%
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Rank Toggle Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {RANKS.map((rank) => (
                            <button
                                key={rank}
                                onClick={() => handleRankClick(rank)}
                                className={`px-6 py-2 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${selectedRank === rank
                                        ? COMMISSION_DATA[rank].buttonColor + " text-white ring-2 ring-offset-2 ring-gray-400"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                <span>{COMMISSION_DATA[rank].icon}</span>
                                <span>{rank}</span>
                            </button>
                        ))}
                    </div>

                    {/* Selected Rank Details */}
                    {selectedRank && (
                        <div
                            className={`p-6 rounded-xl border-2 transition-all duration-300 ${COMMISSION_DATA[selectedRank].color}`}
                        >
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <span>{COMMISSION_DATA[selectedRank].icon}</span>
                                        <span>
                                            {selectedRank} – {COMMISSION_DATA[selectedRank].fullName}
                                        </span>
                                    </h2>
                                    <p className="text-sm mt-2 opacity-80">{COMMISSION_DATA[selectedRank].description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-extrabold">{COMMISSION_DATA[selectedRank].percentage}%</div>
                                    <div className="text-xs uppercase tracking-wide">Commission Rate</div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-current border-opacity-20">
                                <p className="text-sm">
                                    <span className="font-semibold">📌 How it works:</span>{" "}
                                    {COMMISSION_DATA[selectedRank].note}
                                </p>
                            </div>

                            {/* Interactive Example Calculator */}
                            <div className="mt-4 bg-white bg-opacity-40 rounded-lg p-4">
                                <p className="font-semibold text-sm mb-2">💰 Live Example:</p>
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium mb-1">Profit Amount (₹)</label>
                                        <input
                                            type="number"
                                            id="profitInput"
                                            defaultValue="1000"
                                            className="w-full px-3 py-1 border rounded text-sm"
                                            onChange={(e) => {
                                                const profit = parseFloat(e.target.value) || 0;
                                                const commission = getExampleCommission(profit, COMMISSION_DATA[selectedRank].percentage);
                                                document.getElementById("commissionResult").innerText = commission.toFixed(2);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-600">
                                            {selectedRank} gets:{" "}
                                            <strong className="text-lg">
                                                ₹<span id="commissionResult">
                                                    {getExampleCommission(1000, COMMISSION_DATA[selectedRank].percentage).toFixed(2)}
                                                </span>
                                            </strong>
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs mt-2 opacity-75">
                                    * Commission = Profit × ({COMMISSION_DATA[selectedRank].percentage} / 100)
                                </p>
                            </div>
                        </div>
                    )}

                    {!selectedRank && (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-2">👆</div>
                            <p>Click on any rank button above to see its commission structure and details.</p>
                        </div>
                    )}

                    {/* Summary Table (always visible) */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 Commission Summary</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Rank</th>
                                        <th className="px-4 py-2 text-left">Position</th>
                                        <th className="px-4 py-2 text-right">Commission %</th>
                                        <th className="px-4 py-2 text-left">On Profit Difference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RANKS.map((rank) => (
                                        <tr key={rank} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium">{rank}</td>
                                            <td className="px-4 py-2 text-gray-600">{COMMISSION_DATA[rank].fullName}</td>
                                            <td className="px-4 py-2 text-right font-mono">{COMMISSION_DATA[rank].percentage}%</td>
                                            <td className="px-4 py-2 text-gray-500 text-xs">of (Sale Price - Product Cost)</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-semibold">
                                        <td className="px-4 py-2">Total</td>
                                        <td className="px-4 py-2">Payout</td>
                                        <td className="px-4 py-2 text-right">90%</td>
                                        <td className="px-4 py-2 text-xs text-gray-600">Remaining 10% is company profit</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional Note */}
                    <div className="mt-5 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg text-center">
                        ✅ Commission is distributed only to ranks that exist in the upline chain of the seller.
                        <br />
                        Example: If the seller is an ME, their upline (MM, SMM, AGM, DGM, GM) each receive their fixed percentage.
                    </div>
                </div>
            </div>
        </div>
    );
}