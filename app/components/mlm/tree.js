// app/mlm/tree/page.jsx

"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, getLevelColor } from "@/app/components/lib/mlmUtils";

// --------------------- DUMMY DATA (provided) ---------------------
const DUMMY_TREE_RESPONSE = {
    success: true,
    tree: {
        _id: "rbz_root_001",
        fullName: "Rajesh Kumar Reddy",
        applicationId: "RBZ-APP-001",
        mlmUserCode: "RBZ1001",
        userCode: "RBZ1001",
        level: "GM",
        wallet: 525000,
        children: [
            {
                _id: "rbz_dgm_priya",
                fullName: "Priya Sharma",
                applicationId: "RBZ-APP-101",
                mlmUserCode: "RBZ2001",
                userCode: "RBZ2001",
                level: "DGM",
                wallet: 247500,
                children: [
                    {
                        _id: "rbz_agm_amit",
                        fullName: "Amit Patel",
                        applicationId: "RBZ-APP-201",
                        mlmUserCode: "RBZ3001",
                        userCode: "RBZ3001",
                        level: "AGM",
                        wallet: 118000,
                        children: [
                            { _id: "rbz_mm_sneha", fullName: "Sneha Reddy", applicationId: "RBZ-APP-301", mlmUserCode: "RBZ4001", userCode: "RBZ4001", level: "MM", wallet: 48750, children: [] },
                            { _id: "rbz_mm_vikram", fullName: "Vikram Singh", applicationId: "RBZ-APP-302", mlmUserCode: "RBZ4002", userCode: "RBZ4002", level: "MM", wallet: 45200, children: [] },
                        ],
                    },
                    {
                        _id: "rbz_smm_neha",
                        fullName: "Neha Gupta",
                        applicationId: "RBZ-APP-202",
                        mlmUserCode: "RBZ3002",
                        userCode: "RBZ3002",
                        level: "SMM",
                        wallet: 81250,
                        children: [
                            {
                                _id: "rbz_me_kavita",
                                fullName: "Kavita Nair",
                                applicationId: "RBZ-APP-401",
                                mlmUserCode: "RBZ5001",
                                userCode: "RBZ5001",
                                level: "ME",
                                wallet: 29500,
                                children: [
                                    { _id: "rbz_pending_rohan", fullName: "Rohan Das", applicationId: "RBZ-APP-501", mlmUserCode: "RBZ6001", userCode: "RBZ6001", level: "Pending", wallet: 4850, children: [] },
                                ],
                            },
                        ],
                    },
                    { _id: "rbz_smm_rahul", fullName: "Rahul Verma", applicationId: "RBZ-APP-203", mlmUserCode: "RBZ3003", userCode: "RBZ3003", level: "SMM", wallet: 75300, children: [] },
                ],
            },
            {
                _id: "rbz_dgm_vijay",
                fullName: "Vijay Malhotra",
                applicationId: "RBZ-APP-102",
                mlmUserCode: "RBZ2002",
                userCode: "RBZ2002",
                level: "DGM",
                wallet: 231000,
                children: [
                    {
                        _id: "rbz_agm_anjali",
                        fullName: "Anjali Mehta",
                        applicationId: "RBZ-APP-204",
                        mlmUserCode: "RBZ3004",
                        userCode: "RBZ3004",
                        level: "AGM",
                        wallet: 109250,
                        children: [
                            { _id: "rbz_mm_divya", fullName: "Divya K", applicationId: "RBZ-APP-303", mlmUserCode: "RBZ4003", userCode: "RBZ4003", level: "MM", wallet: 47600, children: [] },
                            { _id: "rbz_mm_arjun", fullName: "Arjun Nair", applicationId: "RBZ-APP-304", mlmUserCode: "RBZ4004", userCode: "RBZ4004", level: "MM", wallet: 46800, children: [] },
                        ],
                    },
                    {
                        _id: "rbz_agm_sanjay",
                        fullName: "Sanjay Joshi",
                        applicationId: "RBZ-APP-205",
                        mlmUserCode: "RBZ3005",
                        userCode: "RBZ3005",
                        level: "AGM",
                        wallet: 104750,
                        children: [
                            {
                                _id: "rbz_smm_pooja",
                                fullName: "Pooja Desai",
                                applicationId: "RBZ-APP-305",
                                mlmUserCode: "RBZ4005",
                                userCode: "RBZ4005",
                                level: "SMM",
                                wallet: 71900,
                                children: [
                                    {
                                        _id: "rbz_me_lakshmi",
                                        fullName: "Lakshmi",
                                        applicationId: "RBZ-APP-402",
                                        mlmUserCode: "RBZ5002",
                                        userCode: "RBZ5002",
                                        level: "ME",
                                        wallet: 27650,
                                        children: [
                                            { _id: "rbz_pending_kiran", fullName: "Kiran", applicationId: "RBZ-APP-502", mlmUserCode: "RBZ6002", userCode: "RBZ6002", level: "Pending", wallet: 3950, children: [] },
                                        ],
                                    },
                                ],
                            },
                            { _id: "rbz_smm_ravi", fullName: "Ravi Shankar", applicationId: "RBZ-APP-306", mlmUserCode: "RBZ4006", userCode: "RBZ4006", level: "SMM", wallet: 68400, children: [] },
                        ],
                    },
                ],
            },
            {
                _id: "rbz_agm_sunil",
                fullName: "Sunil Reddy",
                applicationId: "RBZ-APP-103",
                mlmUserCode: "RBZ3006",
                userCode: "RBZ3006",
                level: "AGM",
                wallet: 128500,
                children: [
                    {
                        _id: "rbz_smm_deepa",
                        fullName: "Deepa Nair",
                        applicationId: "RBZ-APP-307",
                        mlmUserCode: "RBZ4007",
                        userCode: "RBZ4007",
                        level: "SMM",
                        wallet: 81600,
                        children: [
                            {
                                _id: "rbz_me_rekha",
                                fullName: "Rekha",
                                applicationId: "RBZ-APP-403",
                                mlmUserCode: "RBZ5003",
                                userCode: "RBZ5003",
                                level: "ME",
                                wallet: 31800,
                                children: [
                                    { _id: "rbz_pending_teja", fullName: "Teja", applicationId: "RBZ-APP-503", mlmUserCode: "RBZ6003", userCode: "RBZ6003", level: "Pending", wallet: 5925, children: [] },
                                ],
                            },
                            { _id: "rbz_me_suresh", fullName: "Suresh", applicationId: "RBZ-APP-404", mlmUserCode: "RBZ5004", userCode: "RBZ5004", level: "ME", wallet: 30750, children: [] },
                        ],
                    },
                    { _id: "rbz_smm_manish", fullName: "Manish Gupta", applicationId: "RBZ-APP-308", mlmUserCode: "RBZ4008", userCode: "RBZ4008", level: "SMM", wallet: 78750, children: [] },
                ],
            },
        ],
    },
    statistics: {
        directChildren: 3,
        totalDownline: 20,
        level: "GM",
    },
};

// Helper: find a node by any identifier
function findNodeByCode(node, code) {
    if (!node) return null;
    if (
        node.mlmUserCode === code ||
        node.userCode === code ||
        node.applicationId === code ||
        node._id === code
    ) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeByCode(child, code);
            if (found) return found;
        }
    }
    return null;
}

// Helper: compute statistics for a given node (direct children, total downline, rank distribution)
function computeNodeStats(node) {
    let totalDownline = 0;
    const rankCount = {
        GM: 0,
        DGM: 0,
        AGM: 0,
        SMM: 0,
        MM: 0,
        ME: 0,
        Pending: 0,
    };
    const stack = [...(node.children || [])];
    while (stack.length) {
        const current = stack.pop();
        totalDownline++;
        const level = current.level || "Pending";
        if (rankCount.hasOwnProperty(level)) rankCount[level]++;
        else rankCount.Pending++;
        if (current.children) stack.push(...current.children);
    }
    return {
        directChildren: node.children?.length || 0,
        totalDownline,
        level: node.level || "Pending",
        rankDistribution: rankCount,
    };
}

export default function MLMTree() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [treeData, setTreeData] = useState(null);
    const [stats, setStats] = useState(null);
    const [rankDist, setRankDist] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [viewMode, setViewMode] = useState("tree");

    // Initialize with dummy data (root)
    useEffect(() => {
        const root = DUMMY_TREE_RESPONSE.tree;
        setTreeData(root);
        setStats(DUMMY_TREE_RESPONSE.statistics);
        const computed = computeNodeStats(root);
        setRankDist(computed.rankDistribution);
        const rootId = root.mlmUserCode || root.userCode || root.applicationId;
        setCurrentUser(rootId);
        setError(null);
    }, []);

    // Function to set a new root based on a user identifier
    const setViewToUser = (identifier) => {
        if (!identifier) {
            setError("Invalid identifier");
            return;
        }
        const node = findNodeByCode(DUMMY_TREE_RESPONSE.tree, identifier);
        if (!node) {
            setError(`User with code "${identifier}" not found in the tree.`);
            setTreeData(null);
            setStats(null);
            setRankDist(null);
            setCurrentUser(identifier);
            return;
        }
        setTreeData(node);
        const nodeStats = computeNodeStats(node);
        setStats({
            directChildren: nodeStats.directChildren,
            totalDownline: nodeStats.totalDownline,
            level: nodeStats.level,
        });
        setRankDist(nodeStats.rankDistribution);
        setCurrentUser(identifier);
        setError(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchCode.trim()) {
            setViewToUser(searchCode.trim());
            setSearchCode("");
        }
    };

    const handleViewUser = (identifier) => {
        setViewToUser(identifier);
    };

    const getDisplayName = (node) => {
        return node.fullName || node.applicationId || node.userCode || "Unknown";
    };

    // Recursive tree renderer
    const renderTree = (node, level = 0) => {
        if (!node) return null;

        const levelClass = node.level ? getLevelColor(node.level) : "bg-gray-400";
        const levelDisplay = node.level || "Pending";
        const walletAmount = node.wallet ? formatCurrency(node.wallet) : "-";
        const identifier = node.mlmUserCode || node.userCode || node.applicationId;

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
                        <span className="text-xs text-green-600 ml-2">
                            Wallet: {walletAmount}
                        </span>
                    </div>
                    {identifier && (
                        <button
                            onClick={() => handleViewUser(identifier)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition"
                            disabled={loading}
                        >
                            View
                        </button>
                    )}
                </div>
                {node.children && node.children.length > 0 && (
                    <div className="tree-children ml-6 border-l-2 border-gray-200 pl-4">
                        {node.children.map((child) => renderTree(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Recursive list view renderer
    const renderListView = (node, level = 0) => {
        if (!node) return null;

        const levelDisplay = node.level || "Pending";
        const walletAmount = node.wallet ? formatCurrency(node.wallet) : "-";
        const identifier = node.mlmUserCode || node.userCode || node.applicationId;

        return (
            <Fragment key={node._id}>
                <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>
                        {getDisplayName(node)}
                    </td>
                    <td className="px-4 py-2">{identifier || "-"}</td>
                    <td className="px-4 py-2">
                        <span
                            className={`px-2 py-1 text-xs rounded-full ${node.level ? getLevelColor(node.level) : "bg-gray-400 text-white"
                                }`}
                        >
                            {levelDisplay}
                        </span>
                    </td>
                    <td className="px-4 py-2">{walletAmount}</td>
                    <td className="px-4 py-2">
                        {identifier && (
                            <button
                                onClick={() => handleViewUser(identifier)}
                                className="text-blue-600 hover:text-blue-800"
                                disabled={loading}
                            >
                                View Downline
                            </button>
                        )}
                    </td>
                </tr>
                {node.children &&
                    node.children.length > 0 &&
                    node.children.map((child) => renderListView(child, level + 1))}
            </Fragment>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Real Beez Tree Structure</h1>
                            <p className="text-gray-600 mt-2">
                                {currentUser ? `Viewing tree for: ${currentUser}` : "No user selected"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("tree")}
                                className={`px-4 py-2 rounded transition ${viewMode === "tree"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                Tree View
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-2 rounded transition ${viewMode === "list"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
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
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="Enter user code or application ID (e.g., RBZ1001, RBZ-APP-101)"
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

                {/* Stats Cards (original) */}
                {stats && treeData && (
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
                            <div className="text-gray-500 text-sm">Level / Status</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.level === "Pending" ? "Pending Approval" : stats.level}
                            </div>
                        </div>
                    </div>
                )}

                {/* NEW: Rank-wise Downline Distribution */}
                {rankDist && treeData && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            📊 Downline Breakdown by Rank
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                            {Object.entries(rankDist).map(([rank, count]) => (
                                <div key={rank} className="text-center p-2 rounded-lg bg-gray-50">
                                    <div className={`text-sm font-bold ${rank === "GM" ? "text-red-600" :
                                            rank === "DGM" ? "text-orange-600" :
                                                rank === "AGM" ? "text-yellow-600" :
                                                    rank === "SMM" ? "text-green-600" :
                                                        rank === "MM" ? "text-blue-600" :
                                                            rank === "ME" ? "text-purple-600" : "text-gray-600"
                                        }`}>
                                        {rank}
                                    </div>
                                    <div className="text-2xl font-bold">{count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NEW: Direct Downline List */}
                {treeData && treeData.children && treeData.children.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            👥 Direct Downline Members ({treeData.children.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">User Code</th>
                                        <th className="px-4 py-2 text-left">Rank</th>
                                        <th className="px-4 py-2 text-right">Wallet</th>
                                        <th className="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {treeData.children.map((child) => (
                                        <tr key={child._id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium">{getDisplayName(child)}</td>
                                            <td className="px-4 py-2">{child.mlmUserCode || child.userCode}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${child.level ? getLevelColor(child.level) : "bg-gray-400 text-white"
                                                    }`}>
                                                    {child.level || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(child.wallet || 0)}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleViewUser(child.mlmUserCode || child.userCode)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                                >
                                                    View Downline
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tree / List Visualization */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {!treeData ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No user selected. Please enter a user code or application ID above.</p>
                        </div>
                    ) : viewMode === "tree" ? (
                        <div className="overflow-x-auto">{renderTree(treeData)}</div>
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

                {/* Legend */}
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
          content: "";
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