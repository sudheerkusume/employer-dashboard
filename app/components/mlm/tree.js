"use client";

import { ArrowBigDownIcon, ArrowBigRightIcon } from "lucide-react";
import { Fragment, useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
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
        GM: "bg-red-500",
        DGM: "bg-orange-500",
        AGM: "bg-yellow-500",
        SGM: "bg-teal-500",
        SMM: "bg-green-500",
        MM: "bg-blue-500",
        ME: "bg-purple-500",
        Pending: "bg-gray-400",
    };
    return colors[level] || "bg-gray-400";
}

function getLevelBg(level) {
    const bg = {
        GM: "bg-red-50 border-red-200",
        DGM: "bg-orange-50 border-orange-200",
        AGM: "bg-yellow-50 border-yellow-200",
        SGM: "bg-teal-50 border-teal-200",
        SMM: "bg-green-50 border-green-200",
        MM: "bg-blue-50 border-blue-200",
        ME: "bg-purple-50 border-purple-200",
        Pending: "bg-gray-50 border-gray-200",
    };
    return bg[level] || "bg-gray-50 border-gray-200";
}

function computeNodeStats(node) {
    let totalDownline = 0;
    const rankCount = { GM: 0, DGM: 0, AGM: 0, SGM: 0, SMM: 0, MM: 0, ME: 0, Pending: 0 };
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

const COMMISSION_PERCENTS = { 1: 0.05, 2: 0.025, 3: 0.02, 4: 0.015, 5: 0.01, 6: 0.005 };
const RANK_UNLOCKED_DEPTHS = { ME: 1, MM: 2, SMM: 3, SGM: 3, DGM: 4, AGM: 5, GM: 6 };

function computeCommissionFromNode(node) {
    const depthMap = new Map();
    for (let d = 1; d <= 6; d++) depthMap.set(d, { sumSaleValue: 0, commission: 0 });
    function traverse(currentNode, depth) {
        if (!currentNode || depth > 6) return;
        const saleAmt = currentNode.saleValue || 2000;
        const depthData = depthMap.get(depth);
        if (depthData) depthData.sumSaleValue += saleAmt;
        if (currentNode.children) {
            for (const child of currentNode.children) traverse(child, depth + 1);
        }
    }
    if (node.children) for (const child of node.children) traverse(child, 1);
    let totalCommission = 0;
    for (let depth = 1; depth <= 6; depth++) {
        const data = depthMap.get(depth);
        const percent = COMMISSION_PERCENTS[depth] || 0;
        data.commission = data.sumSaleValue * percent;
        totalCommission += data.commission;
    }
    return { byDepth: Object.fromEntries(depthMap), totalCommission };
}

function RealTimeCommission({ currentNode }) {
    const commissionData = useMemo(() => {
        if (!currentNode) return null;
        return computeCommissionFromNode(currentNode);
    }, [currentNode]);
    if (!commissionData) return null;
    const maxDepth = RANK_UNLOCKED_DEPTHS[currentNode.level] || 1;
    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">💰 Real-Time Commission for {currentNode.fullName} ({currentNode.level})</h2>
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">Depth Level</th>
                        <th className="px-4 py-2 text-left">Commission %</th>
                        <th className="px-4 py-2 text-right">Total Sale Value</th>
                        <th className="px-4 py-2 text-right">Commission Earned</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5, 6].map(depth => {
                        const data = commissionData.byDepth[depth];
                        if (!data || data.sumSaleValue === 0) return null;
                        const percent = (COMMISSION_PERCENTS[depth] || 0) * 100;
                        return (
                            <tr key={depth} className="border-b">
                                <td className="px-4 py-2">Level {depth}</td>
                                <td className="px-4 py-2">{percent}%</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(data.sumSaleValue)}</td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(data.commission)}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-gray-100">
                    <tr>
                        <td colSpan="3" className="px-4 py-2 text-right font-bold">Total Commission (all depths):</td>
                        <td className="px-4 py-2 text-right font-bold text-green-700">{formatCurrency(commissionData.totalCommission)}</td>
                    </tr>
                </tfoot>
            </table>
            <p className="text-xs text-gray-500 mt-2">* As a {currentNode.level}, you earn commission only up to depth level {maxDepth}.</p>
        </div>
    );
}

function RankDashboard({ userNode, directCount, totalDownline }) {
    const rank = userNode?.level || "Pending";
    const rankOrder = ["ME", "MM", "SMM", "SGM", "DGM", "AGM", "GM"];
    const currentIdx = rankOrder.indexOf(rank);
    const nextRank = currentIdx < rankOrder.length - 1 ? rankOrder[currentIdx + 1] : null;
    const maxDepth = RANK_UNLOCKED_DEPTHS[rank] || 1;
    let promotedDirectCount = 0;
    if (nextRank && userNode.children) {
        const nextRankIdx = rankOrder.indexOf(nextRank);
        promotedDirectCount = userNode.children.filter(child => rankOrder.indexOf(child.level) >= nextRankIdx).length;
    }
    const totalDirect = userNode.children?.length || 0;
    const progressPercent = totalDirect > 0 ? (promotedDirectCount / totalDirect) * 100 : 0;
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold">Your Dashboard</h2>
                <div className="mt-2 text-4xl font-extrabold">{rank}</div>
                <p className="mt-1 opacity-90">{nextRank ? `Next rank: ${nextRank}` : "Highest rank achieved"}</p>
            </div>
            {nextRank && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-800">Promotion to {nextRank}</h3>
                    <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{promotedDirectCount} of {totalDirect} direct members have reached {nextRank}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Commission Structure</h3>
                <p className="text-sm text-gray-600 mb-3">As a {rank}, you earn from downline up to depth level {maxDepth}.</p>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2">Depth Level</th>
                            <th className="px-3 py-2">Commission</th>
                            <th className="px-3 py-2">Eligible?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6].map(depth => {
                            const percent = COMMISSION_PERCENTS[depth] * 100;
                            const eligible = depth <= maxDepth;
                            return (
                                <tr key={depth} className="border-b">
                                    <td className="px-3 py-2">Level {depth}</td>
                                    <td className="px-3 py-2">{percent}%</td>
                                    <td className="px-3 py-2">{eligible ? "✓ Yes" : "✗ Need higher rank"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800">📊 Network Summary</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <div className="text-gray-500 text-sm">Direct Members</div>
                        <div className="text-2xl font-bold text-blue-600">{directCount}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-sm">Total Downline</div>
                        <div className="text-2xl font-bold text-green-600">{totalDownline}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// NEW TREE HIERARCHY WITH SVG LINES (matches reference image)
// ----------------------------------------------------------------------
function TreeHierarchy({ node, onViewUser, expandedNodes, toggleNode, depth = 0 }) {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node._id] === true;
    const levelColor = getLevelColor(node.level);
    const levelBg = getLevelBg(node.level);
    const displayName = node.fullName || node.userCode || "Unknown";

    const handleToggle = (e) => {
        e.stopPropagation();
        toggleNode(node._id, e);
    };

    return (
        <div className="tree-node-container">
            {/* Node Card */}
            <div className={`tree-card ${levelBg} border rounded-xl shadow-sm hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${levelColor} flex-shrink-0`} />
                        <span className="font-semibold text-gray-800 truncate">{displayName}</span>
                        {node.userCode && <span className="text-xs text-gray-500 hidden sm:inline">({node.userCode})</span>}
                        <span className="text-xs font-mono bg-white/70 px-2 py-0.5 rounded-full">{node.level}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        {hasChildren && (
                            <button onClick={handleToggle} className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded-md hover:bg-gray-100">
                                {isExpanded ? "▲" : "▼"}
                            </button>
                        )}
                        <button onClick={() => onViewUser(node.userCode)} className="text-blue-600 text-xs px-2 py-1 rounded-md border border-blue-300 hover:bg-blue-50">
                            View
                        </button>
                    </div>
                </div>
                <div className="px-3 pb-2 text-xs text-gray-600 border-t border-gray-100 pt-1">
                    Sale: {formatCurrency(node.saleValue || 2000)}
                </div>
            </div>

            {/* Children & Lines */}
            {hasChildren && isExpanded && (
                <div className="tree-children-wrapper">
                    <svg className="tree-lines-svg" xmlns="http://www.w3.org/2000/svg">
                        {/* Vertical line from this node to the horizontal bar */}
                        <line x1="50%" y1="0" x2="50%" y2="20" stroke="#cbd5e1" strokeWidth="2" />
                        {/* Horizontal bar across children */}
                        <line
                            x1="0"
                            y1="20"
                            x2="100%"
                            y2="20"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                        />
                        {/* Vertical lines down to each child (drawn per child) */}
                        {node.children.map((_, idx) => {
                            const childCount = node.children.length;
                            const leftPercent = (idx + 0.5) * (100 / childCount);
                            return (
                                <line
                                    key={`line-${node._id}-${idx}`}
                                    x1={`${leftPercent}%`}
                                    y1="20"
                                    x2={`${leftPercent}%`}
                                    y2="40"
                                    stroke="#cbd5e1"
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </svg>
                    <div className="tree-children-row">
                        {node.children.map((child, idx) => (
                            <div key={child._id} className="tree-child-item" style={{ flexBasis: `${100 / node.children.length}%` }}>
                                <TreeHierarchy
                                    node={child}
                                    onViewUser={onViewUser}
                                    expandedNodes={expandedNodes}
                                    toggleNode={toggleNode}
                                    depth={depth + 1}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function MLMTree() {
    const router = useRouter();
    const { rootContext, setRootContext } = useContext(RootContext);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [currentNode, setCurrentNode] = useState(null);
    const [upline, setUpline] = useState([]);
    const [stats, setStats] = useState(null);
    const [rankDist, setRankDist] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [viewMode, setViewMode] = useState("tree");
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [loading, setLoading] = useState(true);

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
            setIsSuperAdmin(userData.role === 'super_admin' || userData.userCode === "SB-000000");
        } else router.push('/mlm/login');
    }, [rootContext, setRootContext, router]);

    const getAllNodeIds = (node) => {
        let ids = [node._id];
        if (node.children) node.children.forEach(child => ids = ids.concat(getAllNodeIds(child)));
        return ids;
    };

    const fetchTree = async (applicationId) => {
        setLoading(true);
        try {
            const url = `/api/mlm/tree?applicationId=${encodeURIComponent(applicationId)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to load tree");
            const tree = data.tree;
            setCurrentNode(tree);
            const nodeStats = computeNodeStats(tree);
            setStats({ directChildren: nodeStats.directChildren, totalDownline: nodeStats.totalDownline, level: nodeStats.level });
            setRankDist(nodeStats.rankDistribution);
            setError(null);
            const allIds = getAllNodeIds(tree);
            const expanded = {};
            allIds.forEach(id => { expanded[id] = true; });
            setExpandedNodes(expanded);
        } catch (err) {
            console.error("Fetch tree error:", err);
            setError(err.message);
            setCurrentNode(null);
        } finally { setLoading(false); }
    };

    const fetchUpline = async (userCode) => {
        if (!userCode || !isSuperAdmin) return;
        try {
            const res = await fetch(`/api/mlm/upline?userCode=${encodeURIComponent(userCode)}`);
            const data = await res.json();
            if (data.success) setUpline(data.upline);
            else setUpline([]);
        } catch (err) { console.error("Fetch upline error:", err); setUpline([]); }
    };

    useEffect(() => { if (loggedInUser && loggedInUser.userCode) fetchTree(loggedInUser.userCode); }, [loggedInUser]);
    useEffect(() => { if (currentNode && isSuperAdmin) fetchUpline(currentNode.userCode); else setUpline([]); }, [currentNode, isSuperAdmin]);

    const setViewToUser = async (identifier) => { if (identifier) await fetchTree(identifier); };
    const handleSearch = (e) => { e.preventDefault(); if (searchCode.trim()) setViewToUser(searchCode.trim()); setSearchCode(""); };
    const toggleNode = (nodeId, e) => { e.stopPropagation(); setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] })); };

    const renderListView = (node, level = 0) => {
        if (!node) return null;
        const identifier = node.userCode;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node._id] === true;
        return (
            <Fragment key={node._id}>
                <tr onClick={(e) => toggleNode(node._id, e)} className={`hover:bg-gray-50 ${hasChildren && "cursor-pointer"}`}>
                    <td className="px-2 py-2 text-center">
                        {hasChildren && <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200">{isExpanded ? <ArrowBigDownIcon size={17} /> : <ArrowBigRightIcon size={17} />}</button>}
                    </td>
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>{node.fullName || node.userCode || "Unknown"}</td>
                    <td className="px-4 py-2">{identifier || "-"}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(node.level)} text-white`}>{node.level}</span></td>
                    <td className="px-4 py-2">{formatCurrency(node.saleValue || 2000)}</td>
                    <td className="px-4 py-2">{identifier && <button onClick={() => setViewToUser(identifier)} className="text-blue-600 hover:text-blue-800">View</button>}</td>
                </tr>
                {hasChildren && isExpanded && node.children.map(child => renderListView(child, level + 1))}
            </Fragment>
        );
    };

    if ((!loggedInUser && !loading) || (loading && !currentNode)) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!loggedInUser && !loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[90%] mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Sales Beez Tree – {loggedInUser?.fullName || "User"}'s Network</h1>
                        <p className="text-gray-600 mt-2">{currentNode ? `Viewing: ${currentNode.fullName || currentNode.userCode} (${currentNode.level})` : "Select a user"}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode("tree")} className={`px-4 py-2 rounded ${viewMode === "tree" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Tree View</button>
                        <button onClick={() => setViewMode("list")} className={`px-4 py-2 rounded ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>List View</button>
                        <button onClick={() => setViewMode("dashboard")} className={`px-4 py-2 rounded ${viewMode === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Dashboard</button>
                    </div>
                </div>

                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} placeholder="Search by Application ID or User Code" className="flex-1 px-4 py-2 border rounded-lg" />
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">View</button>
                    </form>
                </div>

                {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

                {currentNode && isSuperAdmin && upline.length > 0 && (
                    <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h2 className="text-md font-semibold text-blue-800 mb-2">⬆️ Upline (Sponsor Chain) – Super Admin Only</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {upline.map((node, idx) => (
                                <Fragment key={node._id}>
                                    <button onClick={() => setViewToUser(node.userCode)} className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border">
                                        <div className={`w-2 h-2 rounded-full ${getLevelColor(node.level)}`} />
                                        <span className="text-sm font-medium">{node.fullName || node.userCode}</span>
                                        <span className="text-xs text-gray-500">({node.level})</span>
                                    </button>
                                    {idx < upline.length - 1 && <span className="text-gray-400">→</span>}
                                </Fragment>
                            ))}
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full shadow-sm">
                                <div className={`w-2 h-2 rounded-full ${getLevelColor(currentNode?.level)}`} />
                                <span className="text-sm font-bold">{currentNode?.fullName || currentNode?.userCode}</span>
                                <span className="text-xs text-gray-600">({currentNode?.level})</span>
                                <span className="text-xs text-green-600 ml-1">← You are here</span>
                            </span>
                        </div>
                    </div>
                )}

                {stats && currentNode && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4"><div className="text-gray-500 text-sm">Direct Downline</div><div className="text-2xl font-bold text-blue-600">{stats.directChildren}</div></div>
                        <div className="bg-white rounded-lg shadow p-4"><div className="text-gray-500 text-sm">Total Downline</div><div className="text-2xl font-bold text-green-600">{stats.totalDownline}</div></div>
                        <div className="bg-white rounded-lg shadow p-4"><div className="text-gray-500 text-sm">Your Level</div><div className="text-2xl font-bold text-purple-600">{stats.level}</div></div>
                    </div>
                )}

                {rankDist && currentNode && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h2 className="text-lg font-semibold mb-3">📊 Rank Distribution (Downline)</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                            {Object.entries(rankDist).map(([rank, count]) => (
                                <div key={rank} className="text-center p-2 rounded-lg bg-gray-50">
                                    <div className="text-sm font-bold">{rank}</div>
                                    <div className="text-2xl font-bold">{count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentNode && <RealTimeCommission currentNode={currentNode} />}

                {viewMode === "dashboard" && currentNode && <RankDashboard userNode={currentNode} directCount={stats?.directChildren} totalDownline={stats?.totalDownline} />}

                {viewMode !== "dashboard" && currentNode && (
                    <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
                        <h2 className="text-lg font-semibold mb-3">⬇️ Downline Network</h2>
                        {viewMode === "tree" ? (
                            <div className="tree-container">
                                <TreeHierarchy
                                    node={currentNode}
                                    onViewUser={setViewToUser}
                                    expandedNodes={expandedNodes}
                                    toggleNode={toggleNode}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-2 py-3 text-left w-10"></th>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Code</th>
                                            <th className="px-4 py-3 text-left">Rank</th>
                                            <th className="px-4 py-3 text-left">Sale Value</th>
                                            <th className="px-4 py-3 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderListView(currentNode)}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-600 text-center">
                    <p>Click "View" to explore any user | {isSuperAdmin ? "Super Admin: Upline shown" : "Upline hidden"}</p>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>GM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>DGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>AGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-teal-500"></div><span>SGM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>SMM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>MM</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>ME</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span>Pending</span></div>
                    </div>
                </div>
            </div>

            {/* Styles for the new tree hierarchy */}
            <style jsx>{`
                .tree-container {
                    display: flex;
                    justify-content: center;
                    overflow-x: auto;
                    padding: 1rem;
                }
                .tree-node-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }
                .tree-card {
                    width: 220px;
                    transition: all 0.2s;
                    z-index: 2;
                    background-color: white;
                }
                .tree-children-wrapper {
                    position: relative;
                    margin-top: 0.75rem;
                    width: 100%;
                }
                .tree-lines-svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 60px;
                    pointer-events: none;
                    z-index: 1;
                }
                .tree-children-row {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 2rem;
                    position: relative;
                    z-index: 2;
                }
                .tree-child-item {
                    flex: 1 1 auto;
                    min-width: 180px;
                    display: flex;
                    justify-content: center;
                }
                @media (max-width: 640px) {
                    .tree-card {
                        width: 160px;
                    }
                    .tree-child-item {
                        min-width: 140px;
                    }
                    .tree-children-row {
                        gap: 0.75rem;
                    }
                }
                @media (max-width: 480px) {
                    .tree-card {
                        width: 130px;
                    }
                    .tree-child-item {
                        min-width: 110px;
                    }
                }
            `}</style>
        </div>
    );
}