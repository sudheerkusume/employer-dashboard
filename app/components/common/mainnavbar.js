'use client';
import React, { useContext } from 'react';
import {
    BuildingStorefrontIcon, HomeModernIcon, MapIcon, SunIcon,
    ShoppingBagIcon, ArchiveBoxIcon, ScaleIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import RootContext from '../config/rootcontext';

const navItems = [
    { label: 'All', icon: HomeModernIcon },
    { label: 'Apartments', icon: ArchiveBoxIcon },
    { label: 'Villas', icon: HomeModernIcon },
    { label: 'Open Plots', icon: MapIcon },
    { label: 'Farmlands', icon: SunIcon },
    { label: 'Commercial', icon: ShoppingBagIcon },
    { label: 'Go downs', icon: ArchiveBoxIcon },
    { label: 'Legal', icon: ScaleIcon },
    { label: 'Search', icon: MagnifyingGlassIcon },
];

const MainNavbar = () => {
    const { rootContext, setRootContext } = useContext(RootContext);

    return (
        <div className="w-full sm:w-[60%] mx-auto">
            <nav className="bg-[#3D3D3D] w-full z-50 sm:rounded-xl sm:shadow-lg">
                <div className="grid grid-cols-3 sm:flex sm:justify-around items-center text-white">
                    {navItems.map((item) => {
                        const isActive = rootContext.active === item.label;
                        return (
                            <div
                                key={item.label}
                                onClick={() => setRootContext({
                                    ...rootContext,
                                    active: item.label
                                })}
                                className={`text-center cursor-pointer p-2 rounded transition duration-200`}
                            >
                                <item.icon
                                    className={`h-6 w-6 mx-auto ${isActive ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                                />
                                <span
                                    className={`${isActive ? 'text-yellow-500 font-semibold' : 'text-gray-300 hover:text-yellow-400'} text-xs`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Search input box - only visible when active is 'Search' */}
                {rootContext.active === 'Search' && (
                    <div className="px-3 py-2">
                        <input
                            type="text"
                            placeholder="Search properties..."
                            className="w-full h-10 sm:h-12 px-4 rounded-lg border border-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                )}
            </nav>
        </div>
    );
};

export default MainNavbar;
