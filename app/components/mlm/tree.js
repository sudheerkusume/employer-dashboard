"use client";

import { useState, useEffect, useContext, Fragment, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Tree from "react-d3-tree";
import { ArrowBigDownIcon, ArrowBigRightIcon, ArrowLeft, Network, Search, File } from "lucide-react";
import {
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
    Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import RootContext from "../config/rootcontext";

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

// Mobile‑aware CustomNode: shrinks card on small screens
const CustomNode = ({ nodeDatum, onNodeClick }) => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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

    // Responsive dimensions
    const cardWidth = isMobile ? 160 : 220;
    const cardHeight = isMobile ? 90 : 120;
    const offsetX = isMobile ? -80 : -110;
    const offsetY = isMobile ? -50 : -65;
    const fontSizeName = isMobile ? "10px" : "12px";
    const fontSizeOther = isMobile ? "9px" : "11px";

    return (
        <g onClick={handleCardClick} style={{ cursor: "pointer" }}>
            <foreignObject x={offsetX} y={offsetY} width={cardWidth} height={cardHeight}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%" }}>
                    <div className="bg-white rounded-2xl shadow-lg p-2 hover:shadow-xl transition-all duration-300 border-b-4"
                        style={{ borderBottomColor: levelColor, cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
                        <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <div className="relative group inline-block w-full">
                                    <p className="text-gray-900 font-semibold truncate max-w-full flex items-center gap-1"
                                        style={{ fontSize: fontSizeName }}>
                                        <span className="truncate">{userName}</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                            style={{ backgroundColor: `${levelColor}20`, color: levelColor, fontSize: fontSizeOther }}>
                                            {levelIcon} {level}
                                        </span>
                                    </p>
                                    <span style={{ backgroundColor: `${levelColor}` }}
                                        className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-800 text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md pointer-events-none z-50">
                                        {`${userName} (${applicationId})`}
                                    </span>
                                </div>
                                <div className="mt-1 text-gray-600" style={{ fontSize: fontSizeOther }}>
                                    <span>Direct: {directCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

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
// Main Component with Super Admin Support & Responsive Tree
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
    const [upline, setUpline] = useState([]);
    const [loadingUpline, setLoadingUpline] = useState(false);

    // Super admin states
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loadingViewing, setLoadingViewing] = useState(false);
    const [query, setQuery] = useState("");          // for combobox search

    // Responsive tree sizing
    const treeContainerRef = useRef(null);
    const [treeDimensions, setTreeDimensions] = useState({ width: 0, height: 0 });
    const [treeTranslate, setTreeTranslate] = useState({ x: 0, y: 100 });
    const [treeZoom, setTreeZoom] = useState(0.8);

    // Get stored role
    const isSuperAdmin = loggedInUser?.role === "super_admin";

    // Filter users for combobox
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

    // ------------------------------------------------------------------
    // Data fetching functions
    // ------------------------------------------------------------------
    const fetchUpline = async (applicationId) => {
        if (!applicationId) return;
        setLoadingUpline(true);
        try {
            const res = await fetch(`/api/mlm/upline?applicationId=${encodeURIComponent(applicationId)}`);
            const data = await res.json();
            if (data.success) {
                setUpline(data.upline || []);
            } else {
                console.warn("Upline fetch failed:", data.error);
                setUpline([]);
            }
        } catch (err) {
            console.error("Error fetching upline:", err);
            setUpline([]);
        } finally {
            setLoadingUpline(false);
        }
    };

    const fetchTree = async (applicationId, setAsViewing = false) => {
        if (!applicationId) return;
        if (!setAsViewing) setLoading(true);
        else setLoadingViewing(true);
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
            // Expand all nodes
            const allIds = getAllNodeIds(tree);
            const expanded = {};
            allIds.forEach(id => { expanded[id] = true; });
            setExpandedNodes(expanded);
            await fetchUpline(applicationId);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setTreeData(null);
            setCurrentNode(null);
            setUpline([]);
        } finally {
            if (!setAsViewing) setLoading(false);
            else setLoadingViewing(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch('/api/mlm/users');
            const data = await res.json();
            if (data.success && data.users.length) {
                setAllUsers(data.users);
                const firstUser = data.users[0];
                setSelectedUserId(firstUser.applicationId);
                fetchTree(firstUser.applicationId, true);
            } else {
                setError("No users found");
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Could not load user list");
        }
    };

    // ------------------------------------------------------------------
    // Authentication and initial load
    // ------------------------------------------------------------------
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
            if (userData.role === 'super_admin') {
                fetchAllUsers().then(() => setLoading(false));
            } else {
                const storedAppId = localStorage.getItem('mlm_application_id');
                if (storedAppId) {
                    fetchTree(storedAppId);
                } else {
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
            }
        } else {
            router.push('/mlm/login');
        }
    }, [rootContext, setRootContext, router]);

    // When super_admin selects a different user, fetch their tree
    useEffect(() => {
        if (isSuperAdmin && selectedUserId) {
            fetchTree(selectedUserId, true);
        }
    }, [selectedUserId, isSuperAdmin]);

    // Responsive tree: measure container and adjust translate/zoom/nodeSize
    useEffect(() => {
        const updateTreeDimensions = () => {
            if (treeContainerRef.current) {
                const width = treeContainerRef.current.clientWidth;
                const height = treeContainerRef.current.clientHeight;
                setTreeDimensions({ width, height });
            }
        };
        updateTreeDimensions();
        window.addEventListener("resize", updateTreeDimensions);
        return () => window.removeEventListener("resize", updateTreeDimensions);
    }, []);

    useEffect(() => {
        if (treeDimensions.width > 0) {
            // Center horizontally
            const x = treeDimensions.width / 2;
            const y = treeDimensions.height > 600 ? 120 : 80;
            setTreeTranslate({ x, y });
            // Zoom: smaller on mobile (width < 640)
            const newZoom = treeDimensions.width < 640 ? 0.6 : treeDimensions.width < 1024 ? 0.7 : 0.8;
            setTreeZoom(newZoom);
        }
    }, [treeDimensions]);

    // Dynamic node size based on screen width
    const nodeSize = treeDimensions.width < 640
        ? { x: 160, y: 140 }   // mobile
        : treeDimensions.width < 1024
            ? { x: 200, y: 160 }   // tablet
            : { x: 240, y: 180 };  // desktop

    // ------------------------------------------------------------------
    // Event handlers
    // ------------------------------------------------------------------
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCode.trim()) return;
        if (isSuperAdmin) {
            const term = searchCode.trim();
            let foundUser = allUsers.find(u => u.applicationId === term || u.fullName.toLowerCase().includes(term.toLowerCase()));
            if (!foundUser && !term.startsWith("SB-")) {
                try {
                    const userRes = await fetch(`/api/mlm/users?fullName=${encodeURIComponent(term)}`);
                    const userData = await userRes.json();
                    if (userData.success && userData.user.applicationId) {
                        foundUser = userData.user;
                    }
                } catch (err) { }
            }
            if (foundUser) {
                setSelectedUserId(foundUser.applicationId);
                setSearchCode("");
            } else {
                setError("User not found");
            }
        } else {
            let appId = searchCode.trim();
            if (!appId.startsWith("SB-")) {
                try {
                    const userRes = await fetch(`/api/mlm/users?fullName=${encodeURIComponent(appId)}`);
                    const userData = await userRes.json();
                    if (userData.success && userData.user.applicationId) {
                        appId = userData.user.applicationId;
                    } else {
                        throw new Error("User not found by name");
                    }
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                    return;
                }
            }
            await fetchTree(appId);
            setSearchCode("");
        }
    };

    const handleNodeClick = (nodeDatum) => {
        const appId = nodeDatum.attributes?.ApplicationID;
        if (appId && appId !== "-") {
            if (isSuperAdmin) {
                setSelectedUserId(appId);
            } else {
                fetchTree(appId);
            }
        }
    };

    const setViewToUser = (appId) => {
        if (isSuperAdmin) {
            setSelectedUserId(appId);
        } else {
            fetchTree(appId);
        }
    };

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

    const renderUpline = () => {
        if (loadingUpline) {
            return (
                <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700">Loading upline...</span>
                </div>
            );
        }
        if (!upline.length && currentNode && currentNode.sponsorId) {
            return (
                <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-500 text-sm">
                    No upline data available.
                </div>
            );
        }
        if (!upline.length) return null;

        return (
            <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h2 className="text-md font-semibold text-blue-800 mb-2">⬆️ Upline (Sponsor Chain)</h2>
                <div className="flex flex-wrap items-center gap-2">
                    {upline.map((node, idx) => (
                        <Fragment key={node._id}>
                            <button
                                onClick={() => setViewToUser(node.applicationId || node.userCode)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border hover:bg-blue-100 transition"
                            >
                                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getLevelColor(node.level) }} />
                                <span className="text-sm font-medium">{getDisplayName(node)}</span>
                                <span className="text-xs text-gray-500">({node.level})</span>
                            </button>
                            {idx < upline.length - 1 && <span className="text-gray-400">→</span>}
                        </Fragment>
                    ))}
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full shadow-sm">
                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getLevelColor(currentNode?.level) }} />
                        <span className="text-sm font-bold">{getDisplayName(currentNode)}</span>
                        <span className="text-xs text-gray-600">({currentNode?.level})</span>
                        <span className="text-xs text-green-600 ml-1">← You are here</span>
                    </span>
                </div>
            </div>
        );
    };

    // ------------------------------------------------------------------
    // Loading states
    // ------------------------------------------------------------------
    if (loading && !isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-amber-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600"></div>
            </div>
        );
    }

    if (isSuperAdmin && loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-amber-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading user list...</p>
                </div>
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

    // ------------------------------------------------------------------
    // Main render
    // ------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 to-yellow-50 text-gray-900">
            <div className="w-full max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex gap-2 items-center justify-center text-xl font-bold text-gray-800">
                        <ArrowLeft onClick={() => router.back()} className="cursor-pointer" size={18} />
                        Sales Beez Tree Network
                    </div>
                    <p className="text-gray-700">
                        {isSuperAdmin
                            ? `Super Admin Viewing: ${currentNode?.fullName || "Select a user"}`
                            : currentNode ? `Viewing: ${currentNode.fullName} (${currentNode.level})` : "Select a user"}
                    </p>
                    {/* Super Admin User Selector */}
                    {isSuperAdmin && allUsers.length > 0 && (
                        <div className="w-full bg-white rounded-xl shadow-md p-3 flex flex-wrap items-center gap-4">
                            <label className="font-medium text-gray-700 text-sm">Switch user:</label>
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
                                                        <ComboboxOption
                                                            className={({ active }) =>
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"
                                                                }`
                                                            }
                                                            value=""
                                                        >
                                                            {({ selected, active }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
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
                                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                                                                    }`
                                                                }
                                                                value={user.applicationId}
                                                            >
                                                                {({ selected }) => (
                                                                    <>
                                                                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
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
                            {loadingViewing && (
                                <div className="inline-block ml-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-1 sm:flex-row items-center justify-between sm:justify-center">
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setViewMode("tree")}
                                className={`flex gap-1 items-center justify-center px-3 py-1.5 rounded-full ${viewMode === "tree" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                            >
                                <Network size={16} className="text-white" />  Tree View
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex gap-1 items-center justify-center px-3 py-1.5 rounded-full ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                <File size={16} className="text-white" /> List View
                            </button>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2 mt-5 sm:mt-0">
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder={isSuperAdmin ? "Search by Name or ID" : "Search by Application ID or Name"}
                                className="px-3 py-1.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                            />
                            <button type="submit" className="flex gap-1 items-center bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition">
                                <Search size={16} className="text-white" /> View
                            </button>
                        </form>
                    </div>
                </div>

                {currentNode && renderUpline()}

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
                            <div className="text-gray-500 text-sm">Current Rank</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.level}</div>
                        </div>
                    </div>
                )}

                {/* Tree or List View Container */}
                <div
                    ref={treeContainerRef}
                    className="bg-gradient-to-b from-amber-50/30 to-white/50 rounded-2xl shadow-xl p-4 border border-amber-200"
                    style={{ height: "75vh", width: "100%", overflow: "hidden" }}
                >
                    {viewMode === "tree" ? (
                        treeData ? (
                            <Tree
                                data={treeData}
                                orientation="vertical"
                                pathFunc="diagonal"
                                renderCustomNodeElement={(props) => (
                                    <CustomNode nodeDatum={props.nodeDatum} onNodeClick={handleNodeClick} />
                                )}
                                nodeSize={nodeSize}
                                separation={{ siblings: 1.2, nonSiblings: 1.2 }}
                                zoomable={true}
                                panable={true}
                                translate={treeTranslate}
                                pathClassFunc={() => "tree-path"}
                                collapsible={true}
                                initialDepth={treeDimensions.width < 640 ? 1 : 2}
                                zoom={treeZoom}
                                scaleExtent={{ min: 0.3, max: 1.5 }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                🌿 No tree data available – start building your network!
                            </div>
                        )
                    ) : (
                        <div className="overflow-x-auto h-full">
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
            `}</style>
        </div>
    );
}