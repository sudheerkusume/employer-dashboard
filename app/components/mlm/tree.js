"use client";

import { useState, useEffect, useContext, Fragment } from "react";
import { useRouter } from "next/navigation";
import Tree from "react-d3-tree";
import { ArrowBigDownIcon, ArrowBigRightIcon } from "lucide-react";
import RootContext from "../config/rootcontext";

// ----------------------------------------------------------------------
// Utility functions (same as before)
// ----------------------------------------------------------------------
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function getLevelColor(level) {
    const colors = {
        GM: "#ef4444", DGM: "#f97316", AGM: "#eab308", SGM: "#14b8a6",
        SMM: "#22c55e", MM: "#3b82f6", ME: "#a855f7", Pending: "#9ca3af"
    };
    return colors[level] || "#9ca3af";
}

function getLevelIcon(level) {
    const icons = {
        GM: "👑", DGM: "⭐", AGM: "🚀", SGM: "🌳", SMM: "💎", MM: "📈", ME: "🌱", Pending: "⏳"
    };
    return icons[level] || "🌿";
}

function getLevelBgClass(level) {
    const classes = {
        GM: "bg-red-500", DGM: "bg-orange-500", AGM: "bg-yellow-500",
        SGM: "bg-teal-500", SMM: "bg-green-500", MM: "bg-blue-500",
        ME: "bg-purple-500", Pending: "bg-gray-400"
    };
    return classes[level] || "bg-gray-400";
}

function convertToD3Tree(node) {
    if (!node) return null;
    return {
        name: node.fullName || node.userCode || "Unknown",
        attributes: {
            "User Code": node.userCode || "-",
            Level: node.level || "Pending",
            Sale: formatCurrency(node.saleValue || 2000),
            DirectCount: node.children?.length || 0,
            ApplicationID: node.applicationId || "-"
        },
        children: node.children?.map(child => convertToD3Tree(child)) || []
    };
}

const CustomNode = ({ nodeDatum, onNodeClick }) => {
    const level = nodeDatum.attributes?.Level || "Pending";
    const levelColor = getLevelColor(level);
    const levelIcon = getLevelIcon(level);
    const userName = nodeDatum.name || "";
    const applicationId = nodeDatum.attributes?.ApplicationID || "-";
    const saleValue = nodeDatum.attributes?.Sale || "₹0";
    const directCount = nodeDatum.attributes?.DirectCount || 0;

    const handleCardClick = (e) => {
        e.stopPropagation();
        onNodeClick(nodeDatum);
    };

    return (
        <g onClick={handleCardClick} style={{ cursor: "pointer" }}>
            <foreignObject x="-110" y="-65" width="220" height="130">
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%" }}>
                    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-b-4"
                        style={{ borderBottomColor: levelColor, cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="relative group inline-block">
                                    <p className="text-gray-900 text-xs font-semibold truncate">
                                        {userName}
                                    </p>
                                    <span style={{ backgroundColor: `${levelColor}` }} className={`z-50 absolute top-4 left-1/2 -translate-x-1/2 text-gray-800 text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md`}>
                                        {`${userName} (${applicationId})`}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: `${levelColor}20`, color: levelColor }}>
                                        {levelIcon} {level}
                                    </span>
                                </div>
                                <div className="mt-2 text-gray-600 text-xs">
                                    <span>🌿 Direct: {directCount}</span>
                                </div>
                                <p className="mt-1 text-green-600 text-xs font-medium">
                                    💰 {saleValue}
                                </p>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-opacity-10 flex items-center justify-center text-xl"
                                    style={{ backgroundColor: `${levelColor}20`, color: levelColor }}>
                                    {levelIcon}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

// Helper to find node in tree by applicationId (only for internal expansion, not needed if we always fetch from API)
function getAllNodeIds(node) {
    let ids = [node._id];
    if (node.children) {
        node.children.forEach(child => {
            ids = ids.concat(getAllNodeIds(child));
        });
    }
    return ids;
}

function computeNodeStats(node) {
    let totalDownline = 0;
    const rankCount = { GM: 0, DGM: 0, AGM: 0, SMM: 0, MM: 0, ME: 0, Pending: 0 };
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

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function MLMTree() {
    const router = useRouter();
    const { rootContext, setRootContext } = useContext(RootContext);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [viewMode, setViewMode] = useState("tree");
    const [expandedNodes, setExpandedNodes] = useState({});
    const [stats, setStats] = useState(null);
    const [rankDist, setRankDist] = useState(null);

    // Helper to fetch tree by applicationId
    const fetchTree = async (applicationId) => {
        if (!applicationId) return;
        setLoading(true);
        setError(null);
        try {
            const url = `/api/mlm/tree?applicationId=${encodeURIComponent(applicationId)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to load tree");
            const tree = data.tree;
            setCurrentNode(tree);
            setTreeData(convertToD3Tree(tree));
            const computed = computeNodeStats(tree);
            setStats(computed);
            setRankDist(computed.rankDistribution);
            // Expand all nodes
            const allIds = getAllNodeIds(tree);
            const expanded = {};
            allIds.forEach(id => { expanded[id] = true; });
            setExpandedNodes(expanded);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setTreeData(null);
            setCurrentNode(null);
        } finally {
            setLoading(false);
        }
    };

    // Authentication and initial load
    useEffect(() => {
        let userData = null;
        if (rootContext?.mlmUser?.isLoggedIn) userData = rootContext.mlmUser;
        else {
            const storedUserCode = localStorage.getItem('mlm_user_code');
            const storedName = localStorage.getItem('mlm_user_name');
            const storedLevel = localStorage.getItem('mlm_user_level');
            const storedRole = localStorage.getItem('mlm_user_role');
            const isAdmin = localStorage.getItem('mlm_is_super_admin') === 'true';
            if (storedUserCode) {
                userData = {
                    isLoggedIn: true,
                    userCode: storedUserCode,
                    fullName: storedName,
                    level: storedLevel,
                    role: storedRole || (isAdmin ? 'super_admin' : 'user'),
                };
                if (!rootContext?.mlmUser) setRootContext(prev => ({ ...prev, mlmUser: userData }));
            }
        }
        if (userData) {
            setLoggedInUser(userData);
            // Now we need to get the user's applicationId. If not stored, fetch it.
            const storedAppId = localStorage.getItem('mlm_application_id');
            if (storedAppId) {
                fetchTree(storedAppId);
            } else {
                // Fetch user details using userCode to get applicationId
                fetch(`/api/mlm/users?userId=${userData.userCode}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.user.applicationId) {
                            localStorage.setItem('mlm_application_id', data.user.applicationId);
                            fetchTree(data.user.applicationId);
                        } else {
                            throw new Error("Could not retrieve application ID");
                        }
                    })
                    .catch(err => {
                        setError("Failed to get your application ID. Please login again.");
                        setLoading(false);
                    });
            }
        } else {
            router.push('/mlm/login');
        }
    }, [rootContext, setRootContext, router]);

    // Search: accept applicationId or fullName – we'll assume the search term is an applicationId directly,
    // but also try to resolve by name via a user lookup.
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCode.trim()) return;
        setLoading(true);
        setError(null);
        const term = searchCode.trim();
        // Try direct as applicationId first
        try {
            let appId = term;
            // If term doesn't look like an application ID (e.g., not starting with "SB-" or similar), we may need to resolve.
            // For simplicity, we'll try to fetch user by name via a separate endpoint.
            // But assuming the tree API can also accept a name, we can call the tree API with a parameter? 
            // Instead, we'll first try to get the user by name if needed.
            // Here we call /api/mlm/users?fullName=... to get applicationId.
            if (!term.startsWith("SB-")) {
                const userRes = await fetch(`/api/mlm/users?fullName=${encodeURIComponent(term)}`);
                const userData = await userRes.json();
                if (userData.success && userData.user.applicationId) {
                    appId = userData.user.applicationId;
                } else {
                    throw new Error("User not found by name");
                }
            }
            await fetchTree(appId);
            setSearchCode("");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleNodeClick = (nodeDatum) => {
        const appId = nodeDatum.attributes?.ApplicationID;
        if (appId && appId !== "-") fetchTree(appId);
    };

    const setViewToUser = fetchTree; // alias

    const toggleNode = (nodeId, e) => {
        e.stopPropagation();
        setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const getDisplayName = (node) => node.fullName || node.applicationId || node.userCode || "Unknown";

    const renderListView = (node, viewerNode, level = 0) => {
        if (!node) return null;
        const highRanks = ["DGM", "AGM", "GM"];
        if (highRanks.includes(node.level) && node !== viewerNode) {
            return (
                <tr key={node._id}>
                    <td colSpan="6" className="px-4 py-2 text-gray-500 italic">
                        ⚡ {getDisplayName(node)} (reached {node.level}) – hidden
                    </td>
                </tr>
            );
        }
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node._id] === true;

        return (
            <Fragment key={node._id}>
                <tr onClick={(e) => toggleNode(node._id, e)} className={`hover:bg-gray-50 ${hasChildren ? "cursor-pointer" : ""}`}>
                    <td className="px-2 py-2 text-center">
                        {hasChildren && (
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-mono">
                                {isExpanded ? <ArrowBigDownIcon size={17} /> : <ArrowBigRightIcon size={17} />}
                            </button>
                        )}
                    </td>
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>
                        {node.fullName}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{node.applicationId}</td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getLevelBgClass(node.level)}`}>
                            {node.level}
                        </span>
                    </td>
                    <td className="px-4 py-2">{formatCurrency(node.saleValue || 2000)}</td>
                    <td className="px-4 py-2">
                        <button
                            onClick={() => setViewToUser(node.applicationId)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            View
                        </button>
                    </td>
                </tr>
                {hasChildren && isExpanded && node.children.map(child => renderListView(child, viewerNode, level + 1))}
            </Fragment>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-amber-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600"></div>
            </div>
        );
    }

    if (!loggedInUser && !loading) {
        router.push('/mlm/login');
        return null;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 to-yellow-50 text-gray-900">
            <div className="w-full max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">🌳 Real Beez Tree Network</h1>
                        <p className="text-gray-700">
                            {currentNode ? `Viewing: ${currentNode.fullName} (${currentNode.level})` : "Select a user"}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setViewMode("tree")}
                                className={`px-3 py-1.5 rounded ${viewMode === "tree" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                🌲 Tree View
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-1.5 rounded ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                📋 List View
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="Search by Application ID or Name"
                            className="px-3 py-1.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                        />
                        <button type="submit" className="bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition">
                            🔍 View
                        </button>
                    </form>
                </div>

                {/* Stats summary */}
                {stats && currentNode && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Direct Downline</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.directChildren}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Total Downline</div>
                            <div className="text-2xl font-bold text-green-600">{stats.totalDownline}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-gray-500 text-sm">Your Rank</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.level}</div>
                        </div>
                    </div>
                )}

                {/* Tree or List View Container */}
                <div className="bg-gradient-to-b from-amber-50/30 to-white/50 rounded-2xl shadow-xl p-4 border border-amber-200" style={{ height: "75vh", width: "100%", overflow: "auto" }}>
                    {viewMode === "tree" ? (
                        treeData ? (
                            <Tree
                                data={treeData}
                                orientation="vertical"
                                pathFunc="diagonal"
                                renderCustomNodeElement={(props) => (
                                    <CustomNode nodeDatum={props.nodeDatum} onNodeClick={handleNodeClick} />
                                )}
                                nodeSize={{ x: 240, y: 180 }}
                                separation={{ siblings: 1.4, nonSiblings: 1.4 }}
                                zoomable={true}
                                panable={true}
                                translate={{ x: 500, y: 100 }}
                                pathClassFunc={() => "tree-path"}
                                collapsible={true}
                                initialDepth={2}
                                zoom={0.8}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                🌿 No tree data available – start building your network!
                            </div>
                        )
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-xl">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left"></th>
                                        <th className="px-4 py-3 text-left">Name</th>
                                        <th className="px-4 py-3 text-left">Application ID</th>
                                        <th className="px-4 py-3 text-left">Rank</th>
                                        <th className="px-4 py-3 text-left">Sale Value</th>
                                        <th className="px-4 py-3 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentNode && renderListView(currentNode, currentNode)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-6 text-center text-sm text-gray-700">
                    <p>✨ Click on any leaf (card) or "View" button to explore that user ✨</p>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                        {["GM", "DGM", "AGM", "SGM", "SMM", "MM", "ME", "Pending"].map(level => (
                            <div key={level} className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getLevelColor(level) }} />
                                <span>{level}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-green-700">🌱 Use mouse wheel to zoom, drag to pan – watch your tree grow!</p>
                </div>
            </div>

            <style jsx global>{`
                .tree-path {
                    stroke: #7b3f00 !important;
                    stroke-width: 3px;
                    stroke-dasharray: 0;
                    transition: stroke 0.2s;
                }
                .tree-path:hover {
                    stroke: #a05a1a !important;
                }
                .rd3t-label__title {
                    font-size: 11px;
                    font-weight: bold;
                    fill: #2d1b0e;
                }
                .rd3t-label__attributes {
                    font-size: 9px;
                    fill: #5a3a1a;
                }
                svg filter#shadow {
                    filter: drop-shadow(3px 5px 8px rgba(0,0,0,0.2));
                }
                @media (max-width: 768px) {
                    .rd3t-tree-container {
                        min-width: 900px;
                    }
                }
            `}</style>
        </div>
    );
}