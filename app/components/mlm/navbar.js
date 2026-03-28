// app/components/mlm/navbar.jsx
"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import RootContext from "@/app/components/config/rootcontext";

export default function MLMNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { rootContext, setRootContext } = useContext(RootContext);
    const { mlmUser } = rootContext;

    const handleLogout = () => {
        // Clear localStorage
        localStorage.removeItem("mlm_user_code");
        localStorage.removeItem("mlm_user_name");
        localStorage.removeItem("mlm_user_level");

        // Update context
        setRootContext(prev => ({
            ...prev,
            mlmUser: {
                isLoggedIn: false,
                userCode: "",
                fullName: "",
                level: "",
                role: ""
            }
        }));

        router.push("/");
    };

    // Navigation items only for logged-in users
    const navItems = [
        { path: "/mlm/dashboard", label: "Dashboard", icon: "🏠" },
        { path: "/mlm/tree", label: "Tree", icon: "🌳" },
        { path: "/mlm/commissions", label: "Commissions", icon: "💰" },
        { path: "/mlm/sales", label: "Record Sale", icon: "💵" }
    ];

    if (mlmUser.role === "admin") {
        navItems.push({ path: "/applicants", label: "Applicants", icon: "👤" })
    }

    return (
        <nav className="sticky top-0 z-50 bg-gradient-to-b from-yellow-100 to-yellow-50 backdrop-blur-md">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-3">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-xl font-bold text-[#DAA520]">
                            <Image
                                src="/realbeez.png"
                                alt="Logo"
                                width={150}
                                height={100}
                            />
                        </Link>

                        {/* Desktop Navigation - only when logged in */}
                        {mlmUser.isLoggedIn && (
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
                        {mlmUser.isLoggedIn ? (
                            <>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700">{mlmUser.fullName}</div>
                                    <div className="text-xs text-gray-500">
                                        {mlmUser.userCode} {mlmUser.level && `• ${mlmUser.level}`}
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
                {mlmUser.isLoggedIn && (
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