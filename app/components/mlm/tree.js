// app/mlm/tree/page.jsx

"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, getLevelColor } from "@/app/components/lib/mlmUtils";

// Dummy data for testing – a complete tree structure
const DUMMY_TREE_DATA = {
    userCode: "GM-001",
    fullName: "John Smith",
    level: "GM",
    wallet: 1250000,
    children: [
        {
            userCode: "DGM-001",
            fullName: "Sarah Johnson",
            level: "DGM",
            wallet: 450000,
            children: [
                {
                    userCode: "AGM-001",
                    fullName: "Michael Brown",
                    level: "AGM",
                    wallet: 180000,
                    children: [
                        {
                            userCode: "SMM-001",
                            fullName: "Emily Davis",
                            level: "SMM",
                            wallet: 85000,
                            children: [
                                {
                                    userCode: "MM-001",
                                    fullName: "Daniel Wilson",
                                    level: "MM",
                                    wallet: 42000,
                                    children: [
                                        {
                                            userCode: "ME-001",
                                            fullName: "Olivia Martinez",
                                            level: "ME",
                                            wallet: 15000,
                                            children: []
                                        },
                                        {
                                            userCode: "ME-002",
                                            fullName: "James Garcia",
                                            level: "ME",
                                            wallet: 12000,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    userCode: "MM-002",
                                    fullName: "Sophia Rodriguez",
                                    level: "MM",
                                    wallet: 38000,
                                    children: [
                                        {
                                            userCode: "ME-003",
                                            fullName: "William Lee",
                                            level: "ME",
                                            wallet: 8000,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            userCode: "SMM-002",
                            fullName: "Isabella White",
                            level: "SMM",
                            wallet: 72000,
                            children: [
                                {
                                    userCode: "MM-003",
                                    fullName: "Ethan Harris",
                                    level: "MM",
                                    wallet: 31000,
                                    children: [
                                        {
                                            userCode: "ME-004",
                                            fullName: "Mia Clark",
                                            level: "ME",
                                            wallet: 5000,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    userCode: "AGM-002",
                    fullName: "Alexander Lewis",
                    level: "AGM",
                    wallet: 165000,
                    children: [
                        {
                            userCode: "SMM-003",
                            fullName: "Amelia Walker",
                            level: "SMM",
                            wallet: 68000,
                            children: [
                                {
                                    userCode: "MM-004",
                                    fullName: "Lucas Hall",
                                    level: "MM",
                                    wallet: 29000,
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            userCode: "DGM-002",
            fullName: "Emma Young",
            level: "DGM",
            wallet: 480000,
            children: [
                {
                    userCode: "AGM-003",
                    fullName: "Oliver King",
                    level: "AGM",
                    wallet: 175000,
                    children: [
                        {
                            userCode: "SMM-004",
                            fullName: "Ava Scott",
                            level: "SMM",
                            wallet: 73000,
                            children: []
                        }
                    ]
                }
            ]
        }
    ]
};

export default function MLMTree() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [treeData, setTreeData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [viewMode, setViewMode] = useState("tree"); // tree or list

    useEffect(() => {
        const userCode = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
        if (userCode) {
            fetchTreeData(userCode);
            setCurrentUser(userCode);
        } else {
            // No user code, show dummy data by default
            setTreeData(DUMMY_TREE_DATA);
            setStats({
                directChildren: DUMMY_TREE_DATA.children.length,
                totalDownline: countTotalNodes(DUMMY_TREE_DATA),
                wallet: DUMMY_TREE_DATA.wallet
            });
            setCurrentUser("GM-001");
            setLoading(false);
        }
    }, []); // run only once

    const countTotalNodes = (node) => {
        if (!node.children || node.children.length === 0) return 0;
        let count = node.children.length;
        node.children.forEach(child => {
            count += countTotalNodes(child);
        });
        return count;
    };

    const fetchTreeData = async (userCode) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/mlm/tree?userCode=${userCode}&depth=4`);
            const data = await res.json();

            if (data.success) {
                setTreeData(data.tree);
                setStats(data.statistics);
                setCurrentUser(userCode);
            } else {
                console.error("Error fetching tree:", data.error);
                setError(data.error || "Failed to load tree data");
                // Optionally fallback to dummy data?
                // We'll just keep previous data or show empty
            }
        } catch (err) {
            console.error("Error fetching tree:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchCode.trim()) {
            fetchTreeData(searchCode.toUpperCase());
            setSearchCode("");
        }
    };

    const handleViewUser = (userCode) => {
        fetchTreeData(userCode);
    };

    const renderTree = (node, level = 0) => {
        if (!node) return null;

        const levelClass = getLevelColor(node.level);
        const walletAmount = node.wallet ? formatCurrency(node.wallet) : '-';

        return (
            <div key={node.userCode} className="tree-node relative">
                <div className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-3 h-3 rounded-full ${levelClass}`} />
                    <div className="flex-1">
                        <span className="font-medium text-gray-800">{node.fullName}</span>
                        <span className="text-sm text-gray-500 ml-2">({node.userCode})</span>
                        <span className="text-xs text-gray-400 ml-2">{node.level}</span>
                        <span className="text-xs text-green-600 ml-2">
                            Wallet: {walletAmount}
                        </span>
                    </div>
                    <button
                        onClick={() => handleViewUser(node.userCode)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition"
                        disabled={loading}
                    >
                        View
                    </button>
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

        return (
            <Fragment key={node.userCode}>
                <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>
                        {node.fullName}
                    </td>
                    <td className="px-4 py-2">{node.userCode}</td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(node.level)}`}>
                            {node.level}
                        </span>
                    </td>
                    <td className="px-4 py-2">{node.wallet ? formatCurrency(node.wallet) : '-'}</td>
                    <td className="px-4 py-2">
                        <button
                            onClick={() => handleViewUser(node.userCode)}
                            className="text-blue-600 hover:text-blue-800"
                            disabled={loading}
                        >
                            View Downline
                        </button>
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">MLM Tree Structure</h1>
                            <p className="text-gray-600 mt-2">
                                {currentUser ? `Viewing tree for: ${currentUser}` : 'No user selected'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("tree")}
                                className={`px-4 py-2 rounded transition ${viewMode === "tree" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                            >
                                Tree View
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-2 rounded transition ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                            >
                                List View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                            placeholder="Enter user code (e.g., ME-001)"
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            View Tree
                        </button>
                    </form>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Direct Children</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.directChildren}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Total Downline</div>
                            <div className="text-2xl font-bold text-green-600">{stats.totalDownline}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Wallet Balance</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {formatCurrency(stats.wallet || 0)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tree Visualization */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {!treeData ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No user selected. Please enter a user code above.</p>
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
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
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

                {/* Legend */}
                <div className="mt-4 text-sm text-gray-600 text-center">
                    <p>Click on "View" to explore downline | Each node shows Name (UserCode) and Level</p>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>GM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>DGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>AGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>SMM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>MM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>ME</span></div>
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