// app/mlm/tree/page.jsx

"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, getLevelColor } from "@/app/components/lib/mlmUtils";

export default function MLMTree() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [treeData, setTreeData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [viewMode, setViewMode] = useState("tree");

    // Helper to get the identifier from URL or localStorage
    const getIdentifier = () => {
        const urlCode = searchParams.get("mlm_user_code") || searchParams.get("userCode");
        if (urlCode) return urlCode;
        return localStorage.getItem("mlm_user_code") || localStorage.getItem("applicationId");
    };

    useEffect(() => {
        const identifier = getIdentifier();
        if (identifier) {
            fetchTreeData(identifier);
            setCurrentUser(identifier);
        } else {
            setTreeData(null);
            setStats(null);
            setCurrentUser(null);
        }
    }, []);

    const fetchTreeData = async (identifier) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/mlm/tree?userCode=${encodeURIComponent(identifier)}&depth=4`);
            const data = await res.json();

            if (data.success) {
                setTreeData(data.tree);
                setStats(data.statistics);
                setCurrentUser(identifier);
            } else {
                setError(data.error || "Failed to load tree data");
                setTreeData(null);
                setStats(null);
            }
        } catch (err) {
            console.error("Error fetching tree:", err);
            setError("Network error. Please try again.");
            setTreeData(null);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchCode.trim()) {
            fetchTreeData(searchCode.trim());
            setSearchCode("");
        }
    };

    const handleViewUser = (identifier) => {
        fetchTreeData(identifier);
    };

    const getDisplayName = (node) => {
        return node.fullName || node.applicationId || node.userCode || "Unknown";
    };

    const renderTree = (node, level = 0) => {
        if (!node) return null;

        // Safe level/status display
        const levelClass = node.level ? getLevelColor(node.level) : "bg-gray-400";
        let levelDisplay = node.level;
        if (!levelDisplay) {
            levelDisplay = node.status === "approved" ? "Approved" : "Pending";
        }

        const identifier = node.mlmUserCode || node.userCode || node.applicationId;
        const walletAmount = node.wallet ? formatCurrency(node.wallet) : null;

        return (
            <div key={node._id} className="tree-node relative">
                <div className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-3 h-3 rounded-full ${levelClass}`} />
                    <div className="flex-1">
                        <span className="font-medium text-gray-800">{getDisplayName(node)}</span>
                        {identifier && (
                            <span className="text-sm text-gray-500 ml-2">({identifier})</span>
                        )}
                        <span className="text-xs text-gray-400 ml-2">{levelDisplay}</span>
                        {walletAmount !== null && (
                            <span className="text-xs text-green-600 ml-2">
                                Wallet: {walletAmount}
                            </span>
                        )}
                    </div>
                    {identifier && (
                        <button
                            onClick={() => handleViewUser(identifier)}
                            className="text-xs text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded border border-yellow-200 hover:bg-yellow-50 transition"
                            disabled={loading}
                        >
                            View
                        </button>
                    )}
                </div>
                {node.children && node.children.length > 0 && (
                    <div className="tree-children ml-6 border-l-2 border-gray-200 pl-4">
                        {node.children.map(child => renderTree(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const renderListView = (node, level = 0) => {
        if (!node) return null;

        let levelDisplay = node.level;
        if (!levelDisplay) {
            levelDisplay = node.status === "approved" ? "Approved" : "Pending";
        }

        const identifier = node.mlmUserCode || node.userCode || node.applicationId;
        const walletAmount = node.wallet ? formatCurrency(node.wallet) : "-";

        return (
            <Fragment key={node._id}>
                <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>
                        {getDisplayName(node)}
                    </td>
                    <td className="px-4 py-2">{identifier || "-"}</td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${node.level ? getLevelColor(node.level) : "bg-gray-400 text-white"}`}>
                            {levelDisplay}
                        </span>
                    </td>
                    <td className="px-4 py-2">{walletAmount}</td>
                    <td className="px-4 py-2">
                        {identifier && (
                            <button
                                onClick={() => handleViewUser(identifier)}
                                className="text-yellow-600 hover:text-yellow-800"
                                disabled={loading}
                            >
                                View Downline
                            </button>
                        )}
                    </td>
                </tr>
                {node.children && node.children.length > 0 && (
                    node.children.map(child => renderListView(child, level + 1))
                )}
            </Fragment>
        );
    };

    if (loading && !treeData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Real Beez Tree Structure</h1>
                            <p className="text-gray-600 mt-2">
                                {currentUser ? `Viewing tree for: ${currentUser}` : 'No user selected'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("tree")}
                                className={`px-4 py-1.5 rounded-full transition ${viewMode === "tree" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                            >
                                Tree View
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-1.5 rounded-full transition ${viewMode === "list" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                            >
                                List View
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Direct Children</div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.directChildren}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Total Downline</div>
                            <div className="text-2xl font-bold text-green-600">{stats.totalDownline}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Level / Status</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.level || "Pending"}
                                {stats.status && stats.status !== "approved" && ` (${stats.status})`}
                            </div>
                        </div>
                    </div>
                )}

                {stats && (stats.directByLevel || stats.totalByLevel) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Downline Breakdown by Level</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direct Downlines</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Downlines (incl. indirect)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.keys(stats.directByLevel || {}).map(level => (
                                        <tr key={level}>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className={`w-3 h-3 rounded-full inline-block mr-2 ${getLevelColor(level)}`}></div>
                                                <span className="font-medium">{level}</span>
                                            </td>
                                            <td className="px-4 py-2">{stats.directByLevel[level] || 0}</td>
                                            <td className="px-4 py-2">{stats.totalByLevel?.[level] || 0}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(stats.totalByLevel || {}).filter(level => !stats.directByLevel?.[level]).map(level => (
                                        <tr key={level}>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className={`w-3 h-3 rounded-full inline-block mr-2 ${getLevelColor(level)}`}></div>
                                                <span className="font-medium">{level}</span>
                                            </td>
                                            <td className="px-4 py-2">0</td>
                                            <td className="px-4 py-2">{stats.totalByLevel[level]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                    {!treeData ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No user selected. Please enter a user code or application ID above.</p>
                        </div>
                    ) : viewMode === "tree" ? (
                        <div className="overflow-x-auto">
                            {renderTree(treeData)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level/Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {renderListView(treeData)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600 text-center">
                    <p>Click "View" to explore downline | Each node shows Name (Identifier) and Level</p>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>GM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>DGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>AGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>SMM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>MM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>ME</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span>Pending</span></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .tree-node {
                    position: relative;
                }
                .tree-node:not(:last-child) > .tree-children::before {
                    content: '';
                    position: absolute;
                    left: -10px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: #e5e7eb;
                }
                .tree-node:last-child > .tree-children::before {
                    display: none;
                }
                .tree-children {
                    position: relative;
                    margin-top: 0.5rem;
                }
                .tree-children .tree-node {
                    margin-left: 1rem;
                }
            `}</style>
        </div>
    );
}