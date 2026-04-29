"use client";
import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import RootContext from "../config/rootcontext";

export default function Header() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const router = useRouter();
    const user = rootContext?.user || rootContext?.mlmUser;
    const isSuperAdmin = user?.isSuperAdmin || user?.role === "super_admin" || user?.userCode === "SB000000";

    const handleLogout = () => {
        localStorage.clear();
        setRootContext(prev => ({
            ...prev,
            authenticated: false,
            mlmUser: {},
            user: {}
        }));
        router.push("/");
    };

    if (!rootContext.mlmUser) return null;

    return (
        <header className="fixed top-0 z-[99999] w-full bg-white shadow-md px-6 py-1 flex justify-between items-center">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                    <Image
                        src="/salesbeez_logo.png"
                        alt="Caterly"
                        width={180}
                        height={20}
                        className="object-contain relative"
                    />
                </Link>

                {/* Navigation */}
                <nav className="flex gap-6">
                    {isSuperAdmin && (
                        <Link href="/applicants" className="text-gray-700 hover:text-yellow-600 font-medium">
                            Applications
                        </Link>
                    )}
                </nav>
            </div>

            {/* User info & logout */}
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="text-sm text-gray-600">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">Level: {user?.level}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}