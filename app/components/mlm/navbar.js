"use client";
import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import RootContext from "../config/rootcontext";

export default function Header() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const router = useRouter();
    const user = rootContext?.mlmUser;
    const isSuperAdmin = user?.userCode === "SB000001";

    const handleLogout = () => {
        localStorage.removeItem("user_details");
        setRootContext(prev => ({
            ...prev,
            authenticated: false,
            mlmUser: {}
        }));
        router.push("/");
    };

    if (!rootContext.mlmUser) return null;

    return (
        <header className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">                   
                    <span className="text-xl font-bold text-yellow-600">Sales Beez</span>
                </Link>

                {/* Navigation */}
                <nav className="flex gap-6">
                    <Link href="/mlm/tree" className="text-gray-700 hover:text-yellow-600 font-medium">
                        Tree
                    </Link>
                    {isSuperAdmin && (
                        <Link href="/applicants" className="text-gray-700 hover:text-yellow-600 font-medium">
                            Applications
                        </Link>
                    )}
                </nav>
            </div>

            {/* User info & logout */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {user?.fullName} ({user?.userCode})
                </span>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}