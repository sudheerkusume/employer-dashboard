import { Menu, MenuButton, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Recursivemenu = (props) => {
    const { data, textField, subMenuList, url, logOut, profile, onItemClick } = props;
    const router = useRouter();
    const pathname = usePathname();
    const [windowWidth, setWindowWidth] = useState(0);
    const [openMenus, setOpenMenus] = useState({});
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWindowWidth(window.innerWidth);
            setIsMobile(window.innerWidth < 768);
            const handleResize = () => {
                setWindowWidth(window.innerWidth);
                setIsMobile(window.innerWidth < 768);
            };
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

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

    // Check if menu item (or any child) matches current route
    const isMenuItemActive = (menuItem) => {
        if (menuItem[url] === pathname) return true;
        if (menuItem[subMenuList] && menuItem[subMenuList].length) {
            return menuItem[subMenuList].some(child => isMenuItemActive(child));
        }
        return false;
    };

    const toggleMenu = (index, e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenus(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleMenuItemClick = (menuItem, e, index) => {
        e.preventDefault();
        e.stopPropagation();
        if (menuItem[subMenuList] && menuItem[subMenuList]?.length > 0) {
            toggleMenu(index, e);
            return;
        }
        if (menuItem.onClick) menuItem.onClick(e);
        else if (menuItem[url] === "/logout") {
            if (logOut) logOut(e);
        } else if (menuItem[url]) {
            router.push(menuItem[url]);
        }
        if (onItemClick) onItemClick();
    };

    // ---------- Desktop render: underline at bottom of navbar item ----------
    const renderDesktopMenu = (items) =>
        items.map((menuItem, i) => {
            const hasSubMenu = menuItem[subMenuList] && menuItem[subMenuList]?.length > 0;
            const isActive = isMenuItemActive(menuItem);

            if (hasSubMenu) {
                return (
                    <Menu key={i} as="div" className="relative inline-block text-left">
                        {({ open }) => (
                            <>
                                <MenuButton
                                    className={`relative inline-flex items-center w-full px-3 py-2 text-sm font-medium text-black capitalize rounded-md md:justify-center hover:bg-opacity-90 focus:outline-none group
                                    ${isActive ? "text-yellow-600" : "text-black"}`}
                                >
                                    {menuItem[textField]}
                                    <ChevronDownIcon
                                        width={20}
                                        height={20}
                                        className={`ml-1 -mr-1 text-yellow-500 hover:text-yellow-700 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                                        aria-hidden="true"
                                    />
                                    {/* Underline at bottom of the button */}
                                    <span
                                        className={`absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-transform duration-300 
                                        ${isActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                                    />
                                </MenuButton>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <div
                                        className={`${profile ? "right-2" : "left-0"} ${windowWidth >= 1440 && menuItem[subMenuList]?.length > 23
                                                ? "overflow-y-scroll h-[92vh]"
                                                : ""
                                            } z-50 absolute bg-white border border-gray-100 rounded-lg shadow-lg min-w-[200px]`}
                                    >
                                        {menuItem[subMenuList]?.map((subItem, subIndex) => {
                                            const hasSubSubMenu = subItem[subMenuList] && subItem[subMenuList]?.length > 0;
                                            const isSubActive = isMenuItemActive(subItem);
                                            return (
                                                <div key={subIndex} className="relative group">
                                                    <div
                                                        onClick={(e) => {
                                                            if (!hasSubSubMenu) handleMenuItemClick(subItem, e, `${i}-${subIndex}`);
                                                        }}
                                                        className={`w-full p-2 hover:bg-yellow-100 [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg flex items-center justify-between text-black cursor-pointer ${isSubActive ? "bg-yellow-50 text-yellow-700" : ""}`}
                                                    >
                                                        <span className="text-sm font-medium text-black capitalize">
                                                            {subItem[textField]}
                                                        </span>
                                                        {hasSubSubMenu && <ChevronDownIcon width={16} height={16} className="ml-2 -rotate-90" />}
                                                    </div>
                                                    {hasSubSubMenu && (
                                                        <div className="absolute left-full top-0 hidden group-hover:block bg-white border border-gray-100 rounded-lg shadow-lg min-w-[180px]">
                                                            {subItem[subMenuList]?.map((thirdItem, thirdIndex) => (
                                                                <div
                                                                    key={thirdIndex}
                                                                    onClick={(e) => handleMenuItemClick(thirdItem, e, `${i}-${subIndex}-${thirdIndex}`)}
                                                                    className="w-full p-2 hover:bg-yellow-100 [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg text-black cursor-pointer"
                                                                >
                                                                    <span className="text-sm font-medium text-black capitalize">{thirdItem[textField]}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Transition>
                            </>
                        )}
                    </Menu>
                );
            }

            // Simple menu item (no dropdown)
            return (
                <div
                    key={i}
                    onClick={(e) => handleMenuItemClick(menuItem, e, i)}
                    className={`relative px-3 py-2 text-sm font-medium capitalize rounded-md cursor-pointer group
                    ${isActive ? "text-red-600" : "text-black"}`}
                >
                    {menuItem[textField]}
                    {/* Underline at bottom of the div */}
                    <span
                        className={`absolute -bottom-3.5 left-0 h-0.5 transition-transform duration-300 
                        ${isActive ? "w-full scale-x-100 bg-red-500" : "bg-yellow-500 w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                    />
                </div>
            );
        });

    // ---------- Mobile render: underline at bottom of each menu block as well ----------
    const renderMobileMenu = (items, level = 0) =>
        items.map((menuItem, i) => {
            const hasSubMenu = menuItem[subMenuList] && menuItem[subMenuList]?.length > 0;
            const uniqueIndex = `${level}-${i}`;
            const isActive = isMenuItemActive(menuItem);

            if (hasSubMenu) {
                return (
                    <div key={uniqueIndex} className="w-full">
                        <div
                            onClick={(e) => toggleMenu(uniqueIndex, e)}
                            className={`relative flex items-center justify-between w-full px-3 py-3 text-sm font-medium capitalize rounded-md cursor-pointer hover:bg-yellow-50 group
                            ${isActive ? "text-yellow-600" : "text-black"}`}
                        >
                            {menuItem[textField]}
                            <ChevronDownIcon
                                width={20}
                                height={20}
                                className={`text-yellow-500 transition-transform duration-200 ${openMenus[uniqueIndex] ? "rotate-180" : ""}`}
                            />
                            {/* Underline at bottom */}
                            <span
                                className={`absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-transform duration-300 
                                ${isActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                            />
                        </div>
                        {openMenus[uniqueIndex] && (
                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-yellow-200 ml-2">
                                {menuItem[subMenuList]?.map((subItem, subIndex) => {
                                    const subUniqueIndex = `${uniqueIndex}-${subIndex}`;
                                    const hasSubSubMenu = subItem[subMenuList] && subItem[subMenuList]?.length > 0;
                                    const isSubActive = isMenuItemActive(subItem);
                                    return (
                                        <div key={subUniqueIndex}>
                                            <div
                                                onClick={(e) => {
                                                    if (!hasSubSubMenu) handleMenuItemClick(subItem, e, subUniqueIndex);
                                                    else toggleMenu(subUniqueIndex, e);
                                                }}
                                                className={`relative flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-yellow-50 group
                                                ${isSubActive ? "text-yellow-600" : "text-gray-600"}`}
                                            >
                                                {subItem[textField]}
                                                {hasSubSubMenu && <ChevronDownIcon width={16} height={16} className="ml-2 transition-transform duration-200" />}
                                                <span
                                                    className={`absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-transform duration-300 
                                                    ${isSubActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                                                />
                                            </div>
                                            {hasSubSubMenu && openMenus[subUniqueIndex] && (
                                                <div className="pl-4 mt-1 border-l-2 border-yellow-100 ml-2">
                                                    {subItem[subMenuList]?.map((thirdItem, thirdIndex) => {
                                                        const thirdUniqueIndex = `${subUniqueIndex}-${thirdIndex}`;
                                                        const isThirdActive = isMenuItemActive(thirdItem);
                                                        return (
                                                            <div
                                                                key={thirdUniqueIndex}
                                                                onClick={(e) => handleMenuItemClick(thirdItem, e, thirdUniqueIndex)}
                                                                className={`relative px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-yellow-50 group
                                                                ${isThirdActive ? "text-yellow-600" : "text-gray-500"}`}
                                                            >
                                                                {thirdItem[textField]}
                                                                <span
                                                                    className={`absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-transform duration-300 
                                                                    ${isThirdActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            // Simple mobile item
            return (
                <div
                    key={uniqueIndex}
                    onClick={(e) => handleMenuItemClick(menuItem, e, uniqueIndex)}
                    className={`relative w-full px-3 py-3 text-sm font-medium capitalize rounded-md cursor-pointer hover:bg-yellow-50 hover:text-yellow-600 group
                    ${isActive ? "text-yellow-600" : "text-black"}`}
                >
                    {menuItem[textField]}
                    {/* Underline at bottom */}
                    <span
                        className={`absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-transform duration-300 
                        ${isActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"}`}
                    />
                </div>
            );
        });

    return (
        <div className={`flex flex-col flex-wrap items-center ${isMobile ? "w-full" : "md:flex-row"} hide-on-print`}>
            {isMobile ? renderMobileMenu(data) : renderDesktopMenu(data)}
        </div>
    );
};

export default Recursivemenu;