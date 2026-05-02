// app/mlm/real-time-commission/page.jsx
"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
    Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { ArrowDown, ArrowLeft, XCircle } from "lucide-react";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

export default function RealTimeCommissionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [commission, setCommission] = useState({ total: 0, breakdown: [], maxDepthEligible: 1 });
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Super admin states
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [viewingCommission, setViewingCommission] = useState(null);
    const [viewingUserData, setViewingUserData] = useState(null);
    const [loadingViewing, setLoadingViewing] = useState(false);
    const [query, setQuery] = useState("");

    // Get stored credentials
    const storedAppId = typeof window !== "undefined" ? localStorage.getItem("mlm_user_code") : null;
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("mlm_user_role") : null;
    const storedName = typeof window !== "undefined" ? localStorage.getItem("mlm_user_name") : null;
    const isSuperAdmin = storedRole === "super_admin";

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

    // Fetch current user's commission (or placeholder for super_admin)
    useEffect(() => {
        if (isSuperAdmin) {
            const adminUser = {
                fullName: storedName || "Super Admin",
                role: "super_admin",
                level: "Admin",
                userCode: storedAppId || "SB-000000",
            };
            setUserData(adminUser);
            setCommission({ total: 0, breakdown: [], maxDepthEligible: 1 });
            setLoading(false);
            fetchAllUsers();
        } else if (storedAppId) {
            fetchCommissionData(storedAppId);
        } else {
            router.push("/");
            setLoading(false);
        }
    }, [storedAppId, storedRole, storedName]);

    const fetchCommissionData = async (appId, setAsViewing = false) => {
        try {
            const res = await fetch(`/api/mlm/dashboard?applicationId=${appId}`);
            const data = await res.json();
            if (data.success) {
                const commissionData = data.commission || { total: 0, breakdown: [], maxDepthEligible: 1 };
                if (setAsViewing) {
                    setViewingCommission(commissionData);
                    setViewingUserData(data.user);
                } else {
                    setUserData(data.user);
                    setCommission(commissionData);
                }
            } else {
                if (!setAsViewing) {
                    localStorage.removeItem("mlm_user_code");
                    localStorage.removeItem("mlm_user_name");
                    localStorage.removeItem("mlm_user_level");
                    localStorage.removeItem("mlm_user_role");
                    router.push("/");
                }
            }
        } catch (err) {
            console.error("Error fetching commission data:", err);
        } finally {
            if (!setAsViewing) setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch("/api/mlm/users");
            const data = await res.json();
            if (data.success && data.users.length) {
                setAllUsers(data.users);
                // Optionally set first user as default
                setSelectedUserId(data.users[0].applicationId);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // Load commission for selected user (super_admin)
    useEffect(() => {
        if (isSuperAdmin && selectedUserId) {
            setLoadingViewing(true);
            fetchCommissionData(selectedUserId, true).finally(() => setLoadingViewing(false));
        }
    }, [selectedUserId, isSuperAdmin]);

    const resetToMyDashboard = () => {
        setSelectedUserId("");
        setQuery("");
        setViewingCommission(null);
        setViewingUserData(null);
    };

    // Determine what to display
    const displayCommission = isSuperAdmin && viewingCommission ? viewingCommission : commission;
    const displayUser = isSuperAdmin && viewingUserData ? viewingUserData : userData;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (!displayUser) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center text-gray-500">Please log in to view commission details.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <div className="flex gap-2 justify-center items-center">
                        <ArrowLeft onClick={() => router.back()} size={20} className="cursor-pointer" />
                        <h1 className="text-3xl font-bold text-gray-900">Commission Breakdown</h1>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Depth‑based commission structure – calculated from your downline sales
                    </p>
                </div>

                {/* Super Admin User Selector with ComboBox */}
                {isSuperAdmin && (
                    <div className="mb-6 bg-white rounded-xl shadow-md p-4 flex flex-wrap items-center gap-4">
                        <label className="font-medium text-gray-700">View commission for:</label>

                        <div className="relative w-full sm:w-96">
                            <Combobox value={selectedUserId || ""} onChange={setSelectedUserId}>
                                <div className="relative">
                                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500 sm:text-sm">
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
                                        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {filteredUsers.length === 0 && query !== "" ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                    No users found.
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Clear selection option */}
                                                    <ComboboxOption
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"
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
                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-600">
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
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"
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
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                            <XCircle className="h-4 w-4" />
                            Clear Selection
                        </button>

                        {loadingViewing && (
                            <div className="inline-block ml-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
                )}

                {/* Commission Card (same as dashboard) */}
                <div
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-yellow-200 cursor-pointer hover:shadow-xl transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">💰 Commission Earned</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Based on downline sales up to depth {displayCommission.maxDepthEligible} (rank: {displayUser?.level})
                            </p>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{formatCurrency(displayCommission.total)}</div>
                        <ArrowDown className={`transform transition-transform ${showBreakdown ? "rotate-180" : ""}`} size={20} />
                    </div>

                    {showBreakdown && displayCommission.breakdown && (
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
                                            <td className="px-3 py-2 text-center">{item.eligible ? "✓ Yes" : "✗ Need higher rank"}</td>
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

                {/* Optional: Explanation of upward commission flow */}
                <div className="mt-6 bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800 mb-2">📘 How commissions work</h3>
                    <p className="text-sm text-gray-600">
                        Commission flows <strong>upward only</strong>. You earn a fixed percentage from every sale made by members
                        in your downline, down to a certain depth based on your rank. Higher ranks have access to deeper levels.
                        The breakdown above shows <strong>aggregated sales</strong> per depth level and the commission you earned.
                    </p>
                </div>
            </div>
        </div>
    );
}