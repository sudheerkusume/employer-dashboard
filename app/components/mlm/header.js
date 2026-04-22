"use client";
import { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RootContext from "../config/rootcontext";

export default function Header() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const router = useRouter();
    const user = rootContext.user;
    const isSuperAdmin = user?.userCode === "SB000001";

    const handleLogout = () => {
        localStorage.removeItem("user_details");
        setRootContext(prev => ({
            ...prev,
            authenticated: false,
            user: {}
        }));
        router.push("/login");
    };

    if (!rootContext.authenticated) return null;

    return (
        <header className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-bold text-yellow-600">
                    Real Beez
                </Link>
                <nav className="flex gap-4">
                    <Link href="/mlm/tree" className="text-gray-700 hover:text-yellow-600">
                        Tree
                    </Link>
                    {isSuperAdmin && (
                        <Link href="/mlm/applications" className="text-gray-700 hover:text-yellow-600">
                            Applications
                        </Link>
                    )}
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {user?.fullName} ({user?.userCode})
                </span>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}