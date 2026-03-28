// app/mlm/dashboard/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

export default function MLMDashboard() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        personalSales: 0,
        teamSales: 0,
        wallet: 0,
        directCount: 0,
        totalDownline: 0
    });
    const [recentSales, setRecentSales] = useState([]);
    const [recentCommissions, setRecentCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get user code from localStorage only (no URL fallback for dashboard)
        const userCode = localStorage.getItem("mlm_user_code");

        if (userCode) {
            fetchDashboardData(userCode);
        } else {
            setError("No user code found. Please login.");
            setLoading(false);
        }
    }, []);

    const fetchDashboardData = async (userCode) => {
        try {
            setLoading(true);

            // Fetch user data
            const userRes = await fetch(`/api/mlm/users?userId=${userCode}`);
            const userData = await userRes.json();

            if (userData.success) {
                setUserData(userData.user);
                setStats({
                    personalSales: userData.user.personalSales || 0,
                    teamSales: userData.user.teamSales || 0,
                    wallet: userData.user.wallet || 0,
                    directCount: userData.user.directCount || 0,
                    totalDownline: userData.user.totalTeamCount || 0
                });
            } else {
                setError(userData.error || "User not found");
            }

            // Fetch recent sales
            const salesRes = await fetch(`/api/mlm/sales?userCode=${userCode}&limit=5`);
            const salesData = await salesRes.json();
            if (salesData.success) {
                setRecentSales(salesData.sales);
            }

            // Fetch recent commissions
            const commissionRes = await fetch(`/api/mlm/commission?userCode=${userCode}&limit=5`);
            const commissionData = await commissionRes.json();
            if (commissionData.success) {
                setRecentCommissions(commissionData.commissions);
            }

        } catch (err) {
            console.log("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("mlm_user_code");
        localStorage.removeItem("mlm_user_name");
        localStorage.removeItem("mlm_user_level");
        router.push("/");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-gray-50 text-gray-900">
                <div className="bg-white text-gray-900 w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        <h2 className="font-bold mb-2">Error</h2>
                        <p>{error}</p>
                        <div className="mt-4">
                            <button
                                onClick={() => router.push("/")}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="bg-white text-gray-900 w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with User Info */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Real Beez Dashboard</h1>
                        <p className="text-gray-600 mt-2">
                            Welcome, {userData?.fullName} ({userData?.userCode})
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Level: {userData?.level}
                        </p>
                    </div>                  
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-gray-500 text-sm">Personal Sales</div>
                        <div className="text-2xl font-bold text-blue-600 mt-2">
                            {formatCurrency(stats.personalSales)}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-gray-500 text-sm">Team Sales</div>
                        <div className="text-2xl font-bold text-green-600 mt-2">
                            {formatCurrency(stats.teamSales)}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-gray-500 text-sm">Wallet Balance</div>
                        <div className="text-2xl font-bold text-purple-600 mt-2">
                            {formatCurrency(stats.wallet)}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-gray-500 text-sm">Team Size</div>
                        <div className="text-2xl font-bold text-orange-600 mt-2">
                            {stats.totalDownline} Members
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            Direct: {stats.directCount}
                        </div>
                    </div>
                </div>

                {/* Charts and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
                        <div className="space-y-3">
                            {recentSales.length > 0 ? (
                                recentSales.map((sale) => (
                                    <div key={sale._id} className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <div className="font-medium">{sale.description || "Sale"}</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="font-bold text-green-600">
                                            {formatCurrency(sale.amount)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No sales recorded yet</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Commissions */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Commissions</h2>
                        <div className="space-y-3">
                            {recentCommissions.length > 0 ? (
                                recentCommissions.map((commission) => (
                                    <div key={commission._id} className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <div className="font-medium">{commission.level} Commission</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(commission.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="font-bold text-purple-600">
                                            {formatCurrency(commission.commissionAmount)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No commissions received yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => router.push(`/mlm/register?referrer=${userData?.userCode}`)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
                        >
                            Add New Member
                        </button>
                        <button
                            onClick={() => router.push(`/mlm/tree?userCode=${userData?.userCode}`)}
                            className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700"
                        >
                            View Tree
                        </button>
                        <button
                            onClick={() => router.push(`/mlm/commissions?userCode=${userData?.userCode}`)}
                            className="bg-purple-600 text-white px-4 py-1.5 rounded hover:bg-purple-700"
                        >
                            Commission History
                        </button>
                        <button
                            onClick={() => router.push(`/mlm/sales?userCode=${userData?.userCode}`)}
                            className="bg-orange-600 text-white px-4 py-1.5 rounded hover:bg-orange-700"
                        >
                            Record Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}