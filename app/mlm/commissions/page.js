"use client";

import { ArrowBigDownIcon, ArrowBigRightIcon } from "lucide-react";
import { Fragment, useState, useEffect, useMemo } from "react";

// ----------------------------------------------------------------------
// Utility functions
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
        SMM: "bg-green-500",
        MM: "bg-blue-500",
        ME: "bg-purple-500",
        Pending: "bg-gray-400",
    };
    return colors[level] || "bg-gray-400";
}

// ----------------------------------------------------------------------
// Build the exact tree with saleValue = 2000 for every member
// ----------------------------------------------------------------------
const generateId = () => Math.random().toString(36).substr(2, 9);
const SALE_VALUE = 2000; // each member's own purchase/sale value

// Helper to compute rank based on direct children's ranks
function computeRank(node, allNodesMap) {
    if (!node.children || node.children.length === 0) return "ME";

    const directCount = node.children.length;
    if (directCount < 10) return "ME";

    // MM requires at least 10 direct children (already satisfied)
    // For higher ranks, all direct children must have at least that rank
    const childrenRanks = node.children.map((child) => child.level || "ME");

    if (childrenRanks.every((r) => r === "MM" || r === "SMM" || r === "DGM" || r === "AGM" || r === "GM"))
        return "SMM";
    if (childrenRanks.every((r) => r === "SMM" || r === "DGM" || r === "AGM" || r === "GM")) return "DGM";
    if (childrenRanks.every((r) => r === "DGM" || r === "AGM" || r === "GM")) return "AGM";
    if (childrenRanks.every((r) => r === "AGM" || r === "GM")) return "GM";

    return "MM";
}

// Recursive function to assign ranks after tree is built
function assignRanks(node) {
    if (node.children) {
        node.children.forEach((child) => assignRanks(child));
    }
    node.level = computeRank(node);
    return node;
}

function buildTree() {
    // Root: A.Vani
    const root = {
        _id: generateId(),
        fullName: "A.Vani",
        applicationId: "VANI-001",
        mlmUserCode: "VANI001",
        userCode: "VANI001",
        saleValue: SALE_VALUE,
        children: [],
    };

    // Direct children of Vani (10 members)
    const directNames = [
        "Sharadha",
        "Eswari",
        "Ratna",
        "A.U Srinivas",
        "Vishal",
        "Somanna Babu",
        "Somesh",
        "Gayattri Chodhary",
        "Hari",
        "Chandana",
    ];
    const directChildren = directNames.map((name, idx) => ({
        _id: generateId(),
        fullName: name,
        applicationId: `APP-${100 + idx}`,
        mlmUserCode: `CODE${1000 + idx}`,
        userCode: `CODE${1000 + idx}`,
        saleValue: SALE_VALUE,
        children: [],
    }));
    root.children = directChildren;

    // ----- Sharadha (3 children) -----
    const sharadha = directChildren.find((c) => c.fullName === "Sharadha");
    if (sharadha) {
        sharadha.children = [
            {
                _id: generateId(),
                fullName: "Veena Kumari",
                saleValue: SALE_VALUE,
                children: [],
                mlmUserCode: "SHA001",
            },
            { _id: generateId(), fullName: "Ramana", saleValue: SALE_VALUE, children: [], mlmUserCode: "SHA002" },
            { _id: generateId(), fullName: "Smitha", saleValue: SALE_VALUE, children: [], mlmUserCode: "SHA003" },
        ];
    }

    // ----- Eswari (12 children) -----
    const eswari = directChildren.find((c) => c.fullName === "Eswari");
    const eswariChildrenNames = [
        "M Nanda Kishore",
        "M Nagalaxmi",
        "S.Dharani",
        "P.Prabhavathi",
        "T.Mallikarjuna Rao",
        "B.Sreelatha",
        "L.Srinivas",
        "B.Ramakrishan",
        "M.Mahesh Babu",
        "V.Aravind",
        "A.Annapurna",
        "J.Sathya",
    ];
    if (eswari) {
        eswari.children = eswariChildrenNames.map((name, idx) => ({
            _id: generateId(),
            fullName: name,
            saleValue: SALE_VALUE,
            children: [],
            mlmUserCode: `ESW${1000 + idx}`,
        }));
    }

    // J.Sathya (child of Eswari) has 6 children
    const jSathya = eswari?.children.find((c) => c.fullName === "J.Sathya");
    if (jSathya) {
        jSathya.children = [
            "N Narasavani",
            "V.LaxmiManga Tayar",
            "K.Sathyavathi",
            "Sirisha",
            "Roja",
            "Sathyanarayana",
        ].map((name, idx) => ({
            _id: generateId(),
            fullName: name,
            saleValue: SALE_VALUE,
            children: [],
            mlmUserCode: `SAT${1000 + idx}`,
        }));
    }

    // ----- Ratna (10 children) -----
    const ratna = directChildren.find((c) => c.fullName === "Ratna");
    const ratnaChildrenNames = [
        "Vijaya K",
        "Nagamani B",
        "GV Raju",
        "Durga Rani",
        "Subhash K",
        "Venu Madhav Reddy P",
        "Rakesh K",
        "Latha E",
        "Dharamaveer K",
        "P Padma",
    ];
    if (ratna) {
        ratna.children = ratnaChildrenNames.map((name, idx) => ({
            _id: generateId(),
            fullName: name,
            saleValue: SALE_VALUE,
            children: [],
            mlmUserCode: `RAT${1000 + idx}`,
        }));
    }

    // Rakesh K (child of Ratna) has 10 children
    const rakesh = ratna?.children.find((c) => c.fullName === "Rakesh K");
    if (rakesh) {
        const existing = ["Mamatha", "Rajeswari", "Sravanthi", "Sandhya"];
        const extra = [
            "RakeshChild5",
            "RakeshChild6",
            "RakeshChild7",
            "RakeshChild8",
            "RakeshChild9",
            "RakeshChild10",
        ];
        const allNames = [...existing, ...extra];
        rakesh.children = allNames.map((name, idx) => ({
            _id: generateId(),
            fullName: name,
            saleValue: SALE_VALUE,
            children: [],
            mlmUserCode: `RAK${1000 + idx}`,
        }));
    }

    // Assign ranks recursively based on downline structure
    assignRanks(root);
    return root;
}

const REAL_TREE = buildTree();

// ----------------------------------------------------------------------
// Helper functions (navigation, stats, commission)
// ----------------------------------------------------------------------
function findNodeByCode(node, code) {
    if (!node) return null;
    if (
        node.mlmUserCode === code ||
        node.userCode === code ||
        node.applicationId === code ||
        node._id === code ||
        node.fullName.toLowerCase() === code.toLowerCase()
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

function getUplineChain(root, targetNode, currentChain = []) {
    if (!root) return [];
    if (root === targetNode) return currentChain;
    if (root.children) {
        for (const child of root.children) {
            const result = getUplineChain(child, targetNode, [...currentChain, root]);
            if (result.length) return result;
        }
    }
    return [];
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
// Commission Configuration (based on depth level, not rank)
// Depth 1 (direct children): 5%
// Depth 2: 2.5%
// Depth 3: 2%
// Depth 4: 1.5%
// Depth 5: 1%
// Depth 6: 0.5%
// ----------------------------------------------------------------------
const COMMISSION_PERCENTS = { 1: 0.05, 2: 0.025, 3: 0.02, 4: 0.015, 5: 0.01, 6: 0.005 };

// Maximum depth a user can earn from based on their own rank (used only for informational display)
const RANK_UNLOCKED_DEPTHS = { ME: 1, MM: 2, SMM: 3, DGM: 4, AGM: 5, GM: 6 };

// ----------------------------------------------------------------------
// MODIFIED: compute commission for ALL depths (1-6) regardless of rank
// ----------------------------------------------------------------------
function computeCommissionFromNode(node, viewerRank) {
    const depthMap = new Map();
    for (let d = 1; d <= 6; d++) {
        depthMap.set(d, { sumSaleValue: 0, commission: 0 });
    }

    function traverse(currentNode, depth) {
        if (!currentNode || depth > 6) return;
        const saleAmt = currentNode.saleValue || 0;
        const depthData = depthMap.get(depth);
        if (depthData) depthData.sumSaleValue += saleAmt;
        if (currentNode.children) {
            for (const child of currentNode.children) traverse(child, depth + 1);
        }
    }

    if (node.children) {
        for (const child of node.children) traverse(child, 1);
    }

    let totalCommission = 0;
    for (let depth = 1; depth <= 6; depth++) {
        const data = depthMap.get(depth);
        const percent = COMMISSION_PERCENTS[depth] || 0;
        data.commission = data.sumSaleValue * percent;
        totalCommission += data.commission;
    }

    return { byDepth: Object.fromEntries(depthMap), totalCommission };
}

// ----------------------------------------------------------------------
// Real-Time Commission Component (shows full commission for all depths)
// ----------------------------------------------------------------------
function RealTimeCommission({ currentNode }) {
    const commissionData = useMemo(() => {
        if (!currentNode) return null;
        return computeCommissionFromNode(currentNode, currentNode.level);
    }, [currentNode]);

    if (!commissionData) return null;

    const maxDepth = RANK_UNLOCKED_DEPTHS[currentNode.level] || 1;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">
                💰 Real-Time Commission for {currentNode.fullName} ({currentNode.level})
            </h2>
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
                    {[1, 2, 3, 4, 5, 6].map((depth) => {
                        const data = commissionData.byDepth[depth];
                        if (!data || data.sumSaleValue === 0) return null;
                        const percent = (COMMISSION_PERCENTS[depth] || 0) * 100;
                        return (
                            <tr key={depth} className="border-b">
                                <td className="px-4 py-2">Level {depth}</td>
                                <td className="px-4 py-2">{percent}%</td>
                                <td className="px-4 py-2 text-right">
                                    {formatCurrency(data.sumSaleValue)}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">
                                    {formatCurrency(data.commission)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-gray-100">
                    <tr>
                        <td colSpan="3" className="px-4 py-2 text-right font-bold">
                            Total Commission (all depths):
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-700">
                            {formatCurrency(commissionData.totalCommission)}
                        </td>
                    </tr>
                </tfoot>
            </table>
            <p className="text-xs text-gray-500 mt-2">
                * As a {currentNode.level}, you normally earn commission only up to depth level {maxDepth}.
                <br />
                The amounts above show the <strong>full commission</strong> for every depth level (1–6) – your actual earnings
                may be limited by your rank.
                <br />
                Depth 1: 5%, Depth 2: 2.5%, Depth 3: 2%, Depth 4: 1.5%, Depth 5: 1%, Depth 6: 0.5%
            </p>
        </div>
    );
}

// ----------------------------------------------------------------------
// Rank Dashboard Component (unchanged)
// ----------------------------------------------------------------------
function RankDashboard({ userNode, directCount, totalDownline }) {
    const rank = userNode?.level || "Pending";
    const rankOrder = ["ME", "MM", "SMM", "DGM", "AGM", "GM"];
    const currentIdx = rankOrder.indexOf(rank);
    const nextRank = currentIdx < rankOrder.length - 1 ? rankOrder[currentIdx + 1] : null;
    const maxDepth = RANK_UNLOCKED_DEPTHS[rank] || 1;

    let promotedDirectCount = 0;
    if (nextRank && userNode.children) {
        const nextRankIdx = rankOrder.indexOf(nextRank);
        promotedDirectCount = userNode.children.filter((child) => {
            const childIdx = rankOrder.indexOf(child.level);
            return childIdx >= nextRankIdx;
        }).length;
    }
    const totalDirect = userNode.children?.length || 0;
    const promotionNeeded = totalDirect;
    const progressPercent = promotionNeeded > 0 ? (promotedDirectCount / promotionNeeded) * 100 : 0;

    const getExampleText = () => {
        if (rank === "ME") return `Enroll ${10 - totalDirect} more direct members to become MM.`;
        if (rank === "MM")
            return `You have ${promotedDirectCount} out of ${totalDirect} direct members who are MM. Need all to become MM to reach SMM.`;
        if (rank === "SMM")
            return `You have ${promotedDirectCount} out of ${totalDirect} direct members who are SMM. Need all to become SMM for DGM.`;
        if (rank === "DGM") return `All direct members must become DGM to reach AGM.`;
        if (rank === "AGM") return `All direct members must become AGM to reach GM.`;
        return "Congratulations! You are at the highest rank.";
    };

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
                            <span>
                                {promotedDirectCount} of {promotionNeeded} direct members have reached {nextRank}
                            </span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">{getExampleText()}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Commission Structure</h3>
                <p className="text-sm text-gray-600 mb-3">
                    As a {rank}, you earn from downline up to depth level {maxDepth}.
                </p>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2">Depth Level</th>
                            <th className="px-3 py-2">Commission</th>
                            <th className="px-3 py-2">Eligible?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6].map((depth) => {
                            const percent = COMMISSION_PERCENTS[depth] * 100;
                            const eligible = depth <= maxDepth;
                            return (
                                <tr key={depth} className="border-b text-center">
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
// Main Component with per‑node expand/collapse
// ----------------------------------------------------------------------
export default function MLMTree() {
    const [treeData, setTreeData] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [upline, setUpline] = useState([]);
    const [stats, setStats] = useState(null);
    const [rankDist, setRankDist] = useState(null);
    const [searchCode, setSearchCode] = useState("");
    const [viewMode, setViewMode] = useState("tree");
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});

    useEffect(() => {
        const root = REAL_TREE;
        setTreeData(root);
        setCurrentNode(root);
        setUpline([]);
        const computed = computeNodeStats(root);
        setStats({
            directChildren: computed.directChildren,
            totalDownline: computed.totalDownline,
            level: computed.level,
        });
        setRankDist(computed.rankDistribution);
        const allNodeIds = getAllNodeIds(root);
        const initialExpanded = {};
        allNodeIds.forEach((id) => {
            initialExpanded[id] = true;
        });
        setExpandedNodes(initialExpanded);
    }, []);

    function getAllNodeIds(node) {
        let ids = [node._id];
        if (node.children) {
            node.children.forEach((child) => {
                ids = ids.concat(getAllNodeIds(child));
            });
        }
        return ids;
    }

    const setViewToUser = (identifier) => {
        if (!identifier) {
            setError("Invalid identifier");
            return;
        }
        const node = findNodeByCode(REAL_TREE, identifier);
        if (!node) {
            setError(`User "${identifier}" not found.`);
            setCurrentNode(null);
            setUpline([]);
            setStats(null);
            setRankDist(null);
            return;
        }
        setCurrentNode(node);
        const uplineChain = getUplineChain(REAL_TREE, node);
        setUpline(uplineChain);
        const nodeStats = computeNodeStats(node);
        setStats({
            directChildren: nodeStats.directChildren,
            totalDownline: nodeStats.totalDownline,
            level: nodeStats.level,
        });
        setRankDist(nodeStats.rankDistribution);
        setError(null);
        const allIdsUnderNewUser = getAllNodeIds(node);
        const newExpanded = { ...expandedNodes };
        allIdsUnderNewUser.forEach((id) => {
            newExpanded[id] = true;
        });
        setExpandedNodes(newExpanded);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchCode.trim()) setViewToUser(searchCode.trim());
        setSearchCode("");
    };

    const getDisplayName = (node) => node.fullName || node.applicationId || node.userCode || "Unknown";

    const toggleNode = (nodeId, e) => {
        e.stopPropagation();
        setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const renderTree = (node, viewerNode) => {
        if (!node) return null;
        const highRanks = ["DGM", "AGM", "GM"];
        if (highRanks.includes(node.level) && node !== viewerNode) {
            return (
                <div key={node._id} className="p-2 text-gray-500 italic border-l-2 border-gray-300 ml-4">
                    ⚡ {getDisplayName(node)} (reached {node.level}) – hidden per MLM rules
                </div>
            );
        }
        const levelClass = getLevelColor(node.level);
        const identifier = node.mlmUserCode || node.userCode || node.applicationId;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node._id] === true;

        return (
            <div key={node._id} className="tree-node relative">
                <div
                    onClick={(e) => toggleNode(node._id, e)}
                    className={`flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg ${hasChildren && "cursor-pointer"}`}
                >
                    {hasChildren && (
                        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-mono">
                            {isExpanded ? <ArrowBigDownIcon size={17} /> : <ArrowBigRightIcon size={17} />}
                        </button>
                    )}
                    {!hasChildren && <div className="w-6"></div>}
                    <div className={`w-3 h-3 rounded-full ${levelClass}`} />
                    <div className="flex-1">
                        <span className="font-medium text-gray-800">{getDisplayName(node)}</span>
                        {identifier && <span className="text-sm text-gray-500 ml-2">({identifier})</span>}
                        <span className="text-xs text-gray-400 ml-2">{node.level}</span>
                    </div>
                    {identifier && (
                        <button
                            onClick={() => setViewToUser(identifier)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200"
                        >
                            View
                        </button>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="tree-children ml-6 border-l-2 border-gray-200 pl-4">
                        {node.children.map((child) => renderTree(child, viewerNode))}
                    </div>
                )}
            </div>
        );
    };

    const renderUpline = () => {
        if (!upline.length) return null;
        return (
            <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h2 className="text-md font-semibold text-blue-800 mb-2">⬆️ Upline (Sponsor Chain)</h2>
                <div className="flex flex-wrap items-center gap-2">
                    {upline.map((node, idx) => (
                        <Fragment key={node._id}>
                            <button
                                onClick={() => setViewToUser(node.mlmUserCode)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border"
                            >
                                <div className={`w-2 h-2 rounded-full ${getLevelColor(node.level)}`} />
                                <span className="text-sm font-medium">{getDisplayName(node)}</span>
                                <span className="text-xs text-gray-500">({node.level})</span>
                            </button>
                            {idx < upline.length - 1 && <span className="text-gray-400">→</span>}
                        </Fragment>
                    ))}
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${getLevelColor(currentNode?.level)}`} />
                        <span className="text-sm font-bold">{getDisplayName(currentNode)}</span>
                        <span className="text-xs text-gray-600">({currentNode?.level})</span>
                        <span className="text-xs text-green-600 ml-1">← You are here</span>
                    </span>
                </div>
            </div>
        );
    };

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
        const identifier = node.mlmUserCode || node.userCode;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node._id] === true;

        return (
            <Fragment key={node._id}>
                <tr onClick={(e) => toggleNode(node._id, e)} className={`hover:bg-gray-50 ${hasChildren && "cursor-pointer"}`}>
                    <td className={`px-2 py-2 text-center`}>
                        {hasChildren && (
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-mono">
                                {isExpanded ? <ArrowBigDownIcon size={17} /> : <ArrowBigRightIcon size={17} />}
                            </button>
                        )}
                    </td>
                    <td className="px-4 py-2" style={{ paddingLeft: level * 30 + 16 }}>
                        {getDisplayName(node)}
                    </td>
                    <td className="px-4 py-2">{identifier || "-"}</td>
                    <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(node.level)} text-white`}>
                            {node.level}
                        </span>
                    </td>
                    <td className="px-4 py-2">{formatCurrency(node.saleValue)}</td>
                    <td className="px-4 py-2">
                        {identifier && (
                            <button onClick={() => setViewToUser(identifier)} className="text-blue-600 hover:text-blue-800">
                                View
                            </button>
                        )}
                    </td>
                </tr>
                {hasChildren && isExpanded && node.children.map((child) => renderListView(child, viewerNode, level + 1))}
            </Fragment>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="w-full sm:w-[80%] mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Sales Beez Tree – A.Vani Network</h1>
                        <p className="text-gray-600 mt-2">
                            {currentNode ? `Viewing: ${getDisplayName(currentNode)} (${currentNode.level})` : "Select a user"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode("tree")}
                            className={`px-4 py-2 rounded ${viewMode === "tree" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        >
                            Tree View
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-2 rounded ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode("dashboard")}
                            className={`px-4 py-2 rounded ${viewMode === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="Search by name or code (e.g., Eswari, VANI001)"
                            className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                            View
                        </button>
                    </form>
                </div>

                {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

                {currentNode && renderUpline()}

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
                            <div className="text-gray-500 text-sm">Your Level</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.level}</div>
                        </div>
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

                {/* Real-Time Commission - always shows full commission for all depths */}
                {currentNode && <RealTimeCommission currentNode={currentNode} />}

                {viewMode === "dashboard" && currentNode && (
                    <RankDashboard
                        userNode={currentNode}
                        directCount={stats?.directChildren}
                        totalDownline={stats?.totalDownline}
                    />
                )}

                {viewMode !== "dashboard" && currentNode && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold mb-3">⬇️ Downline Network</h2>
                        {viewMode === "tree" ? (
                            <div className="overflow-x-auto">{renderTree(currentNode, currentNode)}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left"></th>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Code</th>
                                            <th className="px-4 py-3 text-left">Rank</th>
                                            <th className="px-4 py-3 text-left">Sale Value</th>
                                            <th className="px-4 py-3 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderListView(currentNode, currentNode)}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-600 text-center">
                    <p>Click "View" to explore any user | Upline shown above | DGM/AGM/GM are hidden from downline view</p>
                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>GM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>DGM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span>AGM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>SMM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>MM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span>ME</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span>Pending</span>
                        </div>
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