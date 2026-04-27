// app/mlm/sales-records/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// ---------- DUMMY SALES DATA (Real Estate Focus) ----------
const DUMMY_SALES_BY_USER = {
    SB000001: [
        { _id: "sale1", createdAt: "2026-04-05T10:30:00Z", amount: 2500000, description: "Premium Villa - 300 sq.yds", productId: "RE-VIL-001", customerName: "Mr. Sharma", commissionEarned: 62500 },
        { _id: "sale2", createdAt: "2026-04-03T14:20:00Z", amount: 1200000, description: "Corner Plot - 200 sq.yds", productId: "RE-PLT-002", customerName: "Mrs. Reddy", commissionEarned: 30000 },
        { _id: "sale3", createdAt: "2026-03-30T09:15:00Z", amount: 3500000, description: "Farmland - 2 acres", productId: "RE-FRM-003", customerName: "Mr. Patel", commissionEarned: 87500 },
        { _id: "sale4", createdAt: "2026-03-25T16:45:00Z", amount: 800000, description: "Godown - 5000 sq.ft", productId: "RE-GDN-004", customerName: "Mr. Khan", commissionEarned: 20000 },
        { _id: "sale5", createdAt: "2026-03-20T11:00:00Z", amount: 5000000, description: "Luxury Villa - 500 sq.yds", productId: "RE-VIL-005", customerName: "Ms. Gupta", commissionEarned: 125000 },
    ],
    RBZ2001: [
        { _id: "sale6", createdAt: "2026-04-04T12:00:00Z", amount: 1800000, description: "Open Land - 300 sq.yds", productId: "RE-OPN-006", customerName: "Mr. Singh", commissionEarned: 90000 },
        { _id: "sale7", createdAt: "2026-03-28T10:15:00Z", amount: 950000, description: "Residential Plot - 150 sq.yds", productId: "RE-PLT-007", customerName: "Mrs. Nair", commissionEarned: 47500 },
        { _id: "sale8", createdAt: "2026-03-22T09:30:00Z", amount: 2800000, description: "Farmhouse with Land - 1.5 acres", productId: "RE-FRM-008", customerName: "Mr. Desai", commissionEarned: 140000 },
    ],
    RBZ3001: [
        { _id: "sale9", createdAt: "2026-04-02T15:45:00Z", amount: 750000, description: "Small Godown - 3000 sq.ft", productId: "RE-GDN-009", customerName: "Mr. Kumar", commissionEarned: 56250 },
        { _id: "sale10", createdAt: "2026-03-27T11:20:00Z", amount: 3200000, description: "Agricultural Land - 3 acres", productId: "RE-FRM-010", customerName: "Mrs. Reddy", commissionEarned: 240000 },
    ],
    RBZ3002: [
        { _id: "sale11", createdAt: "2026-04-01T09:00:00Z", amount: 1100000, description: "Corner Plot - 200 sq.yds", productId: "RE-PLT-011", customerName: "Mr. Verma", commissionEarned: 110000 },
    ],
    RBZ4001: [
        { _id: "sale12", createdAt: "2026-03-15T14:30:00Z", amount: 650000, description: "Open Land - 120 sq.yds", productId: "RE-OPN-012", customerName: "Mr. Yadav", commissionEarned: 97500 },
    ],
    RBZ5001: [
        { _id: "sale13", createdAt: "2026-03-30T10:00:00Z", amount: 420000, description: "Budget Plot - 100 sq.yds", productId: "RE-PLT-013", customerName: "Mr. Das", commissionEarned: 210000 },
        { _id: "sale14", createdAt: "2026-03-28T14:30:00Z", amount: 890000, description: "Small Farmland - 0.5 acres", productId: "RE-FRM-014", customerName: "Mrs. Bose", commissionEarned: 445000 },
    ],
    RBZ5002: [
        { _id: "sale15", createdAt: "2026-03-28T14:30:00Z", amount: 1500000, description: "Commercial Godown - 8000 sq.ft", productId: "RE-GDN-015", customerName: "Mr. Mehta", commissionEarned: 750000 },
    ],
};

// Mapping user code → rank (for commission percentage)
const USER_RANK_MAP = {
    SB000001: { rank: "GM", percentage: 2.5, fullName: "General Manager" },
    RBZ2001: { rank: "DGM", percentage: 5, fullName: "Deputy General Manager" },
    RBZ3001: { rank: "AGM", percentage: 7.5, fullName: "Assistant General Manager" },
    RBZ3002: { rank: "SMM", percentage: 10, fullName: "Senior Master Member" },
    RBZ4001: { rank: "MM", percentage: 15, fullName: "Master Member" },
    RBZ5001: { rank: "ME", percentage: 50, fullName: "Member" },
    RBZ5002: { rank: "ME", percentage: 50, fullName: "Member" },
};

// Commission structure for all ranks (for display)
const COMMISSION_STRUCTURE = [
    { rank: "GM", fullName: "General Manager", percentage: 2.5, color: "bg-red-100" },
    { rank: "DGM", fullName: "Deputy General Manager", percentage: 5, color: "bg-orange-100" },
    { rank: "AGM", fullName: "Assistant General Manager", percentage: 7.5, color: "bg-yellow-100" },
    { rank: "SMM", fullName: "Senior Master Member", percentage: 10, color: "bg-green-100" },
    { rank: "MM", fullName: "Master Member", percentage: 15, color: "bg-blue-100" },
    { rank: "ME", fullName: "Member", percentage: 50, color: "bg-purple-100" },
];

const getDummySales = (userCode) => DUMMY_SALES_BY_USER[userCode] || [];
const getUserRankInfo = (userCode) => USER_RANK_MAP[userCode] || { rank: "ME", percentage: 50, fullName: "Member" };

export default function SalesRecords() {
    const searchParams = useSearchParams();
    const [sales, setSales] = useState([]);
    const [totalSalesAmount, setTotalSalesAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userCode, setUserCode] = useState("");
    const [userRankInfo, setUserRankInfo] = useState(null);
    const [filter, setFilter] = useState({ fromDate: "", toDate: "" });
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });

    useEffect(() => {
        const code = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
        if (code) {
            setUserCode(code);
            setUserRankInfo(getUserRankInfo(code));
            loadSales(code);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const loadSales = (code, dateFilter = filter) => {
        setLoading(true);
        setTimeout(() => {
            let allSales = getDummySales(code);
            if (dateFilter.fromDate) {
                const from = new Date(dateFilter.fromDate);
                allSales = allSales.filter(s => new Date(s.createdAt) >= from);
            }
            if (dateFilter.toDate) {
                const to = new Date(dateFilter.toDate);
                to.setHours(23, 59, 59, 999);
                allSales = allSales.filter(s => new Date(s.createdAt) <= to);
            }
            allSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const total = allSales.reduce((sum, s) => sum + s.amount, 0);
            setSales(allSales);
            setTotalSalesAmount(total);
            calculateStats(allSales);
            setLoading(false);
        }, 300);
    };

    const calculateStats = (salesData) => {
        const today = new Date().toDateString();
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);

        const todayTotal = salesData.filter(s => new Date(s.createdAt).toDateString() === today).reduce((sum, s) => sum + s.amount, 0);
        const weekTotal = salesData.filter(s => new Date(s.createdAt) >= weekAgo).reduce((sum, s) => sum + s.amount, 0);
        const monthTotal = salesData.filter(s => new Date(s.createdAt) >= monthAgo).reduce((sum, s) => sum + s.amount, 0);
        setStats({ today: todayTotal, week: weekTotal, month: monthTotal });
    };

    const handleFilterChange = (e) => setFilter({ ...filter, [e.target.name]: e.target.value });
    const applyFilter = () => userCode && loadSales(userCode, filter);
    const resetFilter = () => {
        const empty = { fromDate: "", toDate: "" };
        setFilter(empty);
        userCode && loadSales(userCode, empty);
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
            <div className="w-full sm:w-[80%] mx-auto px-4 py-8">
                {/* Header with user rank commission */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Sales History</h1>
                    <p className="text-gray-600 mt-2">User: <span className="font-semibold">{userCode || "Not specified"}</span></p>

                    {/* Commission Card for this user */}
                    {userRankInfo && (
                        <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className="text-sm text-gray-600">Your Commission Rate</p>
                                    <p className="text-2xl font-bold text-amber-700">{userRankInfo.percentage}%</p>
                                    <p className="text-xs text-gray-500">as a {userRankInfo.fullName} ({userRankInfo.rank})</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">You earn</p>
                                    <p className="text-lg font-semibold text-green-700">{userRankInfo.percentage}% of profit</p>
                                    <p className="text-xs text-gray-500">on every sale you make</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-gray-600 mt-4">
                        Total Sales Volume: <span className="text-2xl font-bold text-green-600">{formatCurrency(totalSalesAmount)}</span>
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-4">
                        <div className="text-sm opacity-90">Today's Sales</div>
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
                    <h3 className="font-semibold mb-3">Filter Sales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">From Date</label>
                            <input type="date" name="fromDate" value={filter.fromDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To Date</label>
                            <input type="date" name="toDate" value={filter.toDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div className="flex gap-2 items-end">
                            <button onClick={applyFilter} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Apply Filter</button>
                            <button onClick={resetFilter} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Reset</button>
                        </div>
                    </div>
                </div>

                {/* Commission Structure Table (for reference) */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="bg-gray-800 px-6 py-3">
                        <h2 className="text-white font-semibold">📊 MLM Commission Structure</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission %</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {COMMISSION_STRUCTURE.map((item) => (
                                    <tr key={item.rank} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full ${item.color.replace('100', '500')} mr-2`}></div>
                                                <span className="font-medium">{item.rank}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{item.fullName}</td>
                                        <td className="px-6 py-3 text-right font-mono font-bold">{item.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="2" className="px-6 py-3 text-right text-sm font-semibold">Total Payout:</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-green-600">
                                        {COMMISSION_STRUCTURE.reduce((sum, i) => sum + i.percentage, 0)}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                        💡 Commission is calculated on the <strong>profit difference</strong> (Sale Price - Product Cost).
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product / Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission Earned</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No sales found</td></tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sale.description}
                                                {sale.productId && <span className="text-xs text-gray-400 ml-2">({sale.productId})</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{sale.customerName || "—"}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-right">{formatCurrency(sale.amount)}</td>
                                            <td className="px-6 py-4 text-sm text-green-600 text-right">{formatCurrency(sale.commissionEarned)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {sales.length > 0 && (
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="3" className="px-6 py-3 text-right font-semibold">Total:</td>
                                        <td className="px-6 py-3 font-bold text-right">{formatCurrency(sales.reduce((sum, s) => sum + s.amount, 0))}</td>
                                        <td className="px-6 py-3 font-bold text-green-600 text-right">{formatCurrency(sales.reduce((sum, s) => sum + s.commissionEarned, 0))}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center border-t pt-4">
                    <p>🏠 Real estate sales data (plots, villas, farmlands, godowns, open lands). No backend calls – client-side demo.</p>
                    <p>✅ Filtering, stats, and totals work entirely on the dummy dataset.</p>
                </div>
            </div>
        </div>
    );
}