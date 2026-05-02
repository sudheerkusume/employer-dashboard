// app/page.js - Beautiful Dashboard (with super_admin support)
'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/app/components/lib/mlmUtils';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    personalSales: 0,
    teamSales: 0,
    wallet: 0,
    directCount: 0,
    totalDownline: 0,
  });
  const [commission, setCommission] = useState({ total: 0, breakdown: [], maxDepthEligible: 1 });
  const [showCommissionBreakdown, setShowCommissionBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin‑specific states
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewingUserData, setViewingUserData] = useState(null);
  const [viewingStats, setViewingStats] = useState(null);
  const [viewingCommission, setViewingCommission] = useState(null);
  const [loadingViewing, setLoadingViewing] = useState(false);
  const [query, setQuery] = useState("");
  // Get stored values once
  const storedAppId = typeof window !== 'undefined' ? localStorage.getItem('mlm_user_code') : null;
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('mlm_user_role') : null;
  const storedName = typeof window !== 'undefined' ? localStorage.getItem('mlm_user_name') : null;
  const isSuperAdmin = storedRole === 'super_admin';

  // 1. For super_admin: set placeholder userData without DB fetch, then load all users
  useEffect(() => {
    if (isSuperAdmin) {
      // Create a placeholder admin user object
      const adminUser = {
        fullName: storedName || 'Super Admin',
        role: 'super_admin',
        level: 'Admin',
        applicationId: storedAppId || 'SB-000000',
        userCode: storedAppId || 'SB-000000',
      };
      setUserData(adminUser);
      // Set viewing data to null initially
      setViewingUserData(null);
      setViewingStats(null);
      setViewingCommission(null);
      setLoading(false);
      fetchAllUsers();
    } else if (storedAppId) {
      // Normal user: fetch their dashboard
      fetchDashboardData(storedAppId);
    } else {
      setLoading(false);
    }
  }, [storedAppId, storedRole, storedName]);

  // 2. For normal users, fetch their own data
  const fetchDashboardData = async (appId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mlm/dashboard?applicationId=${appId}`);
      const data = await res.json();

      if (data.success) {
        setUserData(data.user);
        setStats({
          personalSales: data.stats.personalSales,
          teamSales: data.stats.teamSales,
          wallet: data.stats.wallet,
          directCount: data.stats.directCount,
          totalDownline: data.stats.totalDownline,
        });
        setCommission(data.commission || { total: 0, breakdown: [], maxDepthEligible: 1 });
      } else {
        // Session expired or user not found
        localStorage.removeItem('mlm_user_code');
        localStorage.removeItem('mlm_user_name');
        localStorage.removeItem('mlm_user_level');
        localStorage.removeItem('mlm_user_role');
        setUserData(null);
        router.push('/');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/mlm/users');
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
        if (data.users.length > 0) {
          // Select the first user by default
          setSelectedUserId(data.users[0].applicationId);
        }
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const loadUserDashboard = async (appId) => {
    try {
      setLoadingViewing(true);
      const res = await fetch(`/api/mlm/dashboard?applicationId=${appId}`);
      const data = await res.json();
      if (data.success) {
        setViewingUserData(data.user);
        setViewingStats({
          personalSales: data.stats.personalSales,
          teamSales: data.stats.teamSales,
          wallet: data.stats.wallet,
          directCount: data.stats.directCount,
          totalDownline: data.stats.totalDownline,
        });
        setViewingCommission(data.commission || { total: 0, breakdown: [], maxDepthEligible: 1 });
      } else {
        console.error('Error loading user dashboard:', data.error);
      }
    } catch (err) {
      console.error('Error loading user dashboard:', err);
    } finally {
      setLoadingViewing(false);
    }
  };

  const resetToMyDashboard = () => {
    // For super_admin, resetting means clearing selected user and showing placeholder?
    // Actually we just set selectedUserId to null and set viewing data to null
    setSelectedUserId(null);
    setViewingUserData(null);
    setViewingStats(null);
    setViewingCommission(null);
  };

  // Determine which data to display
  const displayUser = (userData?.role === 'super_admin' && viewingUserData) ? viewingUserData : userData;
  const displayStats = (userData?.role === 'super_admin' && viewingStats) ? viewingStats : stats;
  const displayCommission = (userData?.role === 'super_admin' && viewingCommission) ? viewingCommission : commission;


  // Filter users based on query (search by name or applicationId)
  const filteredUsers = useMemo(() => {
    if (!allUsers.length) return [];
    if (query === "") return allUsers;
    return allUsers.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.applicationId.toLowerCase().includes(query.toLowerCase()) ||
        (user.mlmUserCode && user.mlmUserCode.toLowerCase().includes(query.toLowerCase()))
    );
  }, [query, allUsers]);

  // Effect to load selected user's dashboard when selection changes
  useEffect(() => {
    if (userData?.role === 'super_admin' && selectedUserId) {
      loadUserDashboard(selectedUserId);
    }
  }, [selectedUserId, userData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
      </div>
    );
  }

  // ------------------ GUEST VIEW (not logged in) ------------------
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section - same as before */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                Build Your Network, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-500">
                  Earn Commissions
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Join our Real Beez platform and start building your downline. Watch your network grow and earn commissions as your team expands.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/mlm/register"
                  className="w-full text-center px-1 py-3 border-2 border-yellow-500 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-600 transition shadow-lg font-semibold"
                >
                  Join Now
                </Link>
                <Link
                  href="/mlm/login"
                  className="w-full text-center px-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Existing Member Login
                </Link>
              </div>
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
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900">Powerful Features</h2>
              <p className="mt-4 text-xl text-gray-600">Everything you need to build and manage your Real Beez business</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: "🌳", title: "Visual Tree Structure", desc: "View your entire network in an intuitive tree layout. Expand nodes to see your downline." },
                { icon: "💰", title: "Commission Tracking", desc: "Real‑time commission calculation based on your downline activity. Withdraw earnings anytime." },
                { icon: "🤝", title: "Referral System", desc: "Invite new members with your unique referral code. Earn bonuses for every active downline." }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-yellow-600 to-yellow-500 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white">Ready to Start Your Real Beez Journey?</h2>
            <p className="mt-4 text-xl text-yellow-100 max-w-2xl mx-auto">
              Join thousands of members who are already building successful networks and earning commissions.
            </p>
            <div className="mt-10">
              <Link
                href="/mlm/register"
                className="px-10 py-4 bg-white text-yellow-600 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg inline-block"
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
                <h3 className="text-white text-xl font-semibold">RealBeez</h3>
                <p className="mt-2">Building networks, creating wealth.</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Quick Links</h4>
                <ul className="mt-2 space-y-2">
                  <li><Link href="/mlm/login" className="hover:text-white">Login</Link></li>
                  <li><Link href="/mlm/register" className="hover:text-white">Register</Link></li>
                  <li><Link href="/mlm/tree" className="hover:text-white">Tree View</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium">Support</h4>
                <ul className="mt-2 space-y-2">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium">Contact</h4>
                <ul className="mt-2 space-y-2">
                  <li>Email: support@realbeez.com</li>
                  <li>Phone: +91 12345 67890</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center">
              &copy; {new Date().getFullYear()} RealBeez. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ------------------ LOGGED-IN DASHBOARD ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Logout */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {userData?.fullName}!
            </h1>
            <p className="text-gray-600 mt-2">
              {userData?.role === 'super_admin'
                ? "You have super admin access. Select a user to view their dashboard."
                : "Here's what's happening with your network today."}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Role: {userData?.role} | Level: {userData?.level} | ID: {userData?.applicationId}
            </p>
          </div>
        </div>

        {/* Super Admin User Selector */}
        {userData?.role === 'super_admin' && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4">
            <label className="font-medium text-gray-700">View dashboard for:</label>

            <div className="relative w-full sm:w-96">
              <Combobox value={selectedUserId || ""} onChange={setSelectedUserId}>
                <div className="relative">
                  <div className="relative w-full cursor-pointer overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500 sm:text-sm">
                    <ComboboxInput
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                      displayValue={(userId) => {
                        const user = allUsers.find((u) => u.applicationId === userId);
                        return user ? `${user.fullName} (${user.applicationId})` : "";
                      }}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="-- Select a user --"
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </ComboboxButton>
                  </div>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery("")}
                  >
                    <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500 bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredUsers.length === 0 && query !== "" ? (
                        <div className="relative cursor-pointer select-none px-4 text-gray-700">
                          No users found.
                        </div>
                      ) : (
                        <>
                          {/* Clear selection option */}
                          <ComboboxOption
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"
                              }`
                            }
                            value=""
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"
                                    }`}
                                >
                                  -- Clear selection --
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </ComboboxOption>

                          {filteredUsers.map((user) => (
                            <ComboboxOption
                              key={user.applicationId}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"
                                }`
                              }
                              value={user.applicationId}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${selected ? "font-medium" : "font-normal"
                                      }`}
                                  >
                                    {user.fullName} ({user.applicationId})
                                    {user.mlmUserCode && ` • ${user.mlmUserCode}`}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-600">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  )}
                                </>
                              )}
                            </ComboboxOption>
                          ))}
                        </>
                      )}
                    </ComboboxOptions>
                  </Transition>
                </div>
              </Combobox>
            </div>

            <button
              onClick={resetToMyDashboard}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Clear Selection
            </button>

            {loadingViewing && (
              <div className="inline-block ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-600"></div>
              </div>
            )}
          </div>
        )}

        {/* Show message if super_admin and no user selected */}
        {userData?.role === 'super_admin' && !selectedUserId && (
          <div className="mt-8 bg-yellow-50 rounded-xl p-6 text-center text-yellow-700">
            Please select a user from the dropdown above to view their dashboard.
          </div>
        )}

        {/* Stats Cards - only show if we have display data */}
        {displayUser && displayStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6">
              {/* Personal Sales */}
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-b-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Personal Sales</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(displayStats.personalSales)}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Team Sales */}
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-b-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Team Sales</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(displayStats.teamSales)}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Team Size */}
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-b-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Team Size  <span className="text-sm text-gray-500 mt-1">Direct: {displayStats.directCount}</span></p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{displayStats.totalDownline}</p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Sales */}
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-b-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Sales</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency((displayStats.teamSales || 0) + (displayStats.personalSales || 0))}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Card */}
            <div onClick={() => setShowCommissionBreakdown(!showCommissionBreakdown)} className="cursor-pointer bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 mb-8 border border-yellow-200 text-gray-900">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">💰 Commission Earned</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on downline sales up to depth {displayCommission.maxDepthEligible} (rank: {displayUser?.level})
                  </p>
                </div>
                <div className='flex gap-2 items-center justify-center'>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(displayCommission.total)}</div>
                  {!showCommissionBreakdown ? <ArrowBigUp size={20} /> : <ArrowBigDown size={20} />}
                </div>
              </div>
              {showCommissionBreakdown && displayCommission.breakdown && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Depth Level</th>
                        <th className="px-3 py-2 text-left">Commission %</th>
                        <th className="px-3 py-2 text-right">Total Sale Value</th>
                        <th className="px-3 py-2 text-right">Commission Earned</th>
                        <th className="px-3 py-2 text-center">Eligible?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCommission.breakdown.map((item) => (
                        <tr key={item.depth} className="border-b">
                          <td className="px-3 py-2">Level {item.depth}</td>
                          <td className="px-3 py-2">{item.percent}%</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.saleValue)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-600">
                            {formatCurrency(item.commission)}
                          </td>
                          <td className="px-3 py-2 text-center">{item.eligible ? '✓ Yes' : '✗ Need higher rank'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-3 py-2 text-right font-bold">Total Commission:</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">{formatCurrency(displayCommission.total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  <p className="text-xs text-gray-500 mt-2">
                    * Commission is calculated only on downline sales up to depth level {displayCommission.maxDepthEligible} (based on rank {displayUser?.level}).
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="w-full flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/mlm/register?referrer=${displayUser?.userCode}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-md font-medium"
                >
                  ➕ Add New Member
                </button>
                <button
                  onClick={() => router.push(`/mlm/tree?userCode=${displayUser?.userCode}`)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-600 transition shadow-md font-medium"
                >
                  🌳 View Tree
                </button>
                <button
                  onClick={() => router.push(`/mlm/commissions?userCode=${displayUser?.userCode}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-600 transition shadow-md font-medium"
                >
                  📊 Commission History
                </button>
                <button
                  onClick={() => router.push(`/mlm/sales?userCode=${displayUser?.userCode}`)}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-600 transition shadow-md font-medium"
                >
                  💰 Record Sale
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}