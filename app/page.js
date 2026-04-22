// app/page.js
'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/app/components/lib/mlmUtils';

export default function HomePage() {
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

  // Check if user is logged in
  const userCode = typeof window !== 'undefined' ? localStorage.getItem('mlm_user_code') : null;

  useEffect(() => {
    if (userCode) {
      fetchDashboardData(userCode);
    } else {
      setLoading(false);
    }
  }, [userCode]);

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
        setError(userData.error || 'User not found');
        // If user not found, clear localStorage and show landing
        localStorage.removeItem('mlm_user_code');
        localStorage.removeItem('mlm_user_name');
        localStorage.removeItem('mlm_user_level');
        localStorage.removeItem('mlm_user_role');
        setUserData(null);
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
      console.log('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mlm_user_code');
    localStorage.removeItem('mlm_user_name');
    localStorage.removeItem('mlm_user_level');
    localStorage.removeItem('mlm_user_role');
    setUserData(null);
    router.push('/');
  };

  // Show loading while checking auth or fetching data
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  // Show landing page if user is not logged in
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Build Your Network, <br />
                <span className="text-yellow-600">Earn Commissions</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Join our Real Beez platform and start building your downline. Watch your network grow and earn commissions as your team expands.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/mlm/register"
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-md font-medium"
                >
                  Join Now
                </Link>
                <Link
                  href="/mlm/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Existing Member Login
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">No credit card required. Start for free.</p>
            </div>
            <div className="hidden md:block">
              <img
                src="/images/mlm-image.png"
                alt="Real Beez Illustration"
                className="rounded-lg shadow-xl h-[580px] w-full object-fit"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Powerful Features</h2>
              <p className="mt-2 text-gray-600">Everything you need to build and manage your Real Beez business</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Visual Tree Structure</h3>
                <p className="mt-2 text-gray-600">View your entire network in an intuitive tree layout. Expand nodes to see your downline.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Commission Tracking</h3>
                <p className="mt-2 text-gray-600">Real‑time commission calculation based on your downline activity. Withdraw earnings anytime.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Referral System</h3>
                <p className="mt-2 text-gray-600">Invite new members with your unique referral code. Earn bonuses for every active downline.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-2 text-gray-600">Start building your network in three simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">1</div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Register</h3>
                <p className="mt-2 text-gray-600">Sign up with your personal details and choose a sponsor (or start as a root member).</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">2</div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Build Your Team</h3>
                <p className="mt-2 text-gray-600">Invite others using your referral code. They become your downline and help you grow.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">3</div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Earn Commissions</h3>
                <p className="mt-2 text-gray-600">Get paid based on your network size and sales. Level up as you reach promotion thresholds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-yellow-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to Start Your Real Beez Journey?</h2>
            <p className="mt-4 text-yellow-100 max-w-2xl mx-auto">
              Join thousands of members who are already building successful networks and earning commissions.
            </p>
            <div className="mt-8">
              <Link
                href="/mlm/register"
                className="px-8 py-3 bg-white text-yellow-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md"
              >
                Sign Up Now – It's Free
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-lg font-semibold">RealBeez</h3>
                <p className="mt-2 text-sm">Building networks, creating wealth.</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Quick Links</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li><Link href="/mlm/login" className="hover:text-white">Login</Link></li>
                  <li><Link href="/mlm/register" className="hover:text-white">Register</Link></li>
                  <li><Link href="/mlm/tree" className="hover:text-white">Tree View</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium">Support</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium">Contact</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Email: support@realbeez.com</li>
                  <li>Phone: +91 12345 67890</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
              &copy; {new Date().getFullYear()} RealBeez. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ======================
  // Logged-in user dashboard
  // ======================
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
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
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
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add New Member
            </button>
            <button
              onClick={() => router.push(`/mlm/tree?userCode=${userData?.userCode}`)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Tree
            </button>
            <button
              onClick={() => router.push(`/mlm/commissions?userCode=${userData?.userCode}`)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Commission History
            </button>
            <button
              onClick={() => router.push(`/mlm/sales?userCode=${userData?.userCode}`)}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Record Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}