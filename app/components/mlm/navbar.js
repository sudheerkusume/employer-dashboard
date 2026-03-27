"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MLMNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [userCode, setUserCode] = useState("");
    const [userLevel, setUserLevel] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Get MLM user info from localStorage
        const code = localStorage.getItem("mlm_user_code");
        const name = localStorage.getItem("mlm_user_name");
        const level = localStorage.getItem("mlm_user_level");

        if (code) {
            setUserCode(code);
            setUserName(name || code);
            setUserLevel(level || "");
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("mlm_user_code");
        localStorage.removeItem("mlm_user_name");
        localStorage.removeItem("mlm_user_level");
        setIsLoggedIn(false);
        setUserCode("");
        setUserName("");
        setUserLevel("");
        router.push("/");
    };

    // Navigation items only for logged-in users
    const navItems = [
        { path: "/mlm/dashboard", label: "Dashboard", icon: "🏠" },
        { path: "/mlm/tree", label: "Tree", icon: "🌳" },
        { path: "/mlm/commissions", label: "Commissions", icon: "💰" },
        { path: "/mlm/sales", label: "Record Sale", icon: "💵" }
    ];
    const code = localStorage && localStorage.getItem("mlm_user_code");

    if (code === "GM") {
        navItems.push({ path: "/applicants", label: "Applicants", icon: "👤" })
    }

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-3">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-xl font-bold text-[#DAA520]">
                            Real Beez
                        </Link>

                        {/* Desktop Navigation - only when logged in */}
                        {isLoggedIn && (
                            <div className="hidden md:flex space-x-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition ${pathname === item.path
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        <span className="mr-1">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700">{userName}</div>
                                    <div className="text-xs text-gray-500">
                                        {userCode} {userLevel && `• ${userLevel}`}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/mlm/login"
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation - only when logged in */}
                {isLoggedIn && (
                    <div className="md:hidden overflow-x-auto pb-2">
                        <div className="flex space-x-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${pathname === item.path
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "text-gray-600"
                                        }`}
                                >
                                    {item.icon} {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}