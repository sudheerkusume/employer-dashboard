"use client";
import { useContext, useEffect, useState, useRef } from "react";
import { Menu, X, ChevronDown, User, LogOut, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RootContext from "../config/rootcontext";
import Recursivemenu from "../common/recursivemenu";

export default function Header() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const router = useRouter();
    const user = rootContext?.mlmUser || rootContext?.user;   // MLM user object
    const isSuperAdmin = user?.role === "super_admin";

    // Local UI states (same as MenuHeader)
    const [menuShow, setMenuShow] = useState(false);
    const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
    const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);
    const mobileDropdownRef = useRef(null);
    const desktopDropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);

    // Build dynamic menu (same as MenuHeader)
    const menu = [
        { name: "Add New Member", text: "Add New Member", url: "/mlm/register", items: [] },
        { name: "View Tree", text: "View Tree", url: "/mlm/tree", items: [] },
        { name: "Commission History", text: "Commission History", url: "/mlm/commissions", items: [] },
        { name: "Record Sale", text: "Record Sale", url: "/mlm/sales", items: [] },
    ];

    // Also add "Applications" link for super_admin (as in original Header)
    if (isSuperAdmin) {
        menu.push({
            name: "Applications",
            text: "Applications",
            url: "/applicants",
            items: []
        });
    }

    // ---------- UI helpers ----------
    const showMenu = () => {
        setMenuShow(!menuShow);
        if (!menuShow) setIsMobileUserMenuOpen(false);
    };

    const handleMenuItemClick = () => setMenuShow(false);

    const handleLogout = async () => {
        localStorage.clear();
        setRootContext(prev => ({
            ...prev,
            authenticated: false,
            mlmUser: {},
            user: {}
        }));
        router.push("/");
    };

    const getUserInitials = () => {
        if (!user?.fullName) return "U";
        return user.fullName
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarUrl = () => {
        return user?.avatar || user?.userProfileImage || null;
    };
    const avatarUrl = getAvatarUrl();

    // ---------- Click outside listeners (same as MenuHeader) ----------
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
                setIsMobileUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
                setIsDesktopUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuShow && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMenuShow(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuShow]);

    // Print style injection (as in original MenuHeader)
    useEffect(() => {
        document.body.classList.add("printing");
        const style = document.createElement("style");
        style.innerHTML = `
      @media print {
        .printing .hide-on-print {
          display: none !important;
        }
      }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Don't render if no MLM user is logged in (same as original Header)
    if (!rootContext.mlmUser) return null;

    return (
        <>
            {menu && menu.length > 0 && (
                <div className="bg-white relative flex-col items-center">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between md:hidden">
                        <div onClick={showMenu} className="hide-on-print">
                            {!menuShow && <Menu size={20} className="z-50 m-5 md:hidden text-gray-700" />}
                            {menuShow && <X size={20} className="z-50 m-5 border-2 border-gray-900 rounded-md md:hidden text-gray-700" />}
                        </div>
                        <div className="flex items-center mr-5 md:hidden hover:cursor-pointer hide-on-print">
                            {/* User Avatar with Image or Initials */}
                            <div className="relative mr-2">
                                {avatarUrl ? (
                                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200">
                                        <Image
                                            src={avatarUrl}
                                            alt={user?.fullName || "User avatar"}
                                            width={32}
                                            height={32}
                                            className="object-cover w-full h-full"
                                            unoptimized
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm leading-none">
                                        {getUserInitials()}
                                    </div>
                                )}
                            </div>

                            {/* User name with dropdown indicator */}
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                    setIsMobileUserMenuOpen(!isMobileUserMenuOpen);
                                    if (menuShow) setMenuShow(false);
                                }}
                            >
                                <span className="text-gray-700 font-medium max-w-[100px] truncate">
                                    {user?.fullName || "User"}
                                </span>
                                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isMobileUserMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </div>

                    {/* Mobile user menu dropdown */}
                    {isMobileUserMenuOpen && (
                        <div ref={mobileDropdownRef} className="absolute right-5 top-16 bg-white shadow-lg rounded-lg py-2 z-[60] min-w-[150px] border border-gray-200">
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                                onClick={() => {
                                    setIsMobileUserMenuOpen(false);
                                    setMenuShow(false);
                                }}
                            >
                                <User size={16} />
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    )}

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="px-5 bg-white shadow-md sticky left-0 right-0 top-0 z-10 flex items-center justify-between text-sm h-16 w-full hide-on-print">
                          <div className="flex items-center justify-center gap-2">
                              <Link href={"/"}>
                                <Image
                                    src="/salesbeez_logo.png"
                                    alt="Realbeez logo"
                                    width={100}
                                    height={20}
                                    priority
                                    className="object-contain h-12 sm:h-16"
                                />
                            </Link>
                            <Recursivemenu
                                data={menu || []}
                                textField={"text"}
                                subMenuList={"items"}
                                url={"url"}
                            />
                          </div>

                            {/* Desktop Profile Dropdown */}
                            <div className="relative hide-on-print" ref={desktopDropdownRef}>
                                <button
                                    onClick={() => setIsDesktopUserMenuOpen(!isDesktopUserMenuOpen)}
                                    className="flex items-center gap-2 px-4 py-2 mx-2 text-sm font-medium text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200">
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt={user?.fullName || "User avatar"}
                                                width={32}
                                                height={32}
                                                className="object-cover w-full h-full"
                                                unoptimized
                                                priority
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm leading-none">
                                                {getUserInitials()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="max-w-[120px] truncate">
                                        {user?.fullName || "User"}
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDesktopUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Desktop Dropdown Menu */}
                                {isDesktopUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-1 border border-gray-200 z-50">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                                            onClick={() => setIsDesktopUserMenuOpen(false)}
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {menuShow && (
                        <div ref={mobileMenuRef} className="md:hidden absolute top-[72px] left-0 right-0 bg-white shadow-lg z-50 hide-on-print">
                            <div className="p-4">
                                <Recursivemenu
                                    data={menu || []}
                                    textField={"text"}
                                    subMenuList={"items"}
                                    url={"url"}
                                    onItemClick={handleMenuItemClick}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}