import {
    BuildingStorefrontIcon, HomeModernIcon, MapIcon, SunIcon,
    ShoppingBagIcon, ArchiveBoxIcon, ScaleIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const navItems = [
    { label: 'All', icon: HomeModernIcon, active: true },
    { label: 'Apartments', icon: ArchiveBoxIcon },
    { label: 'Villas', icon: HomeModernIcon },
    { label: 'Open Plots', icon: MapIcon },
    { label: 'Farmlands', icon: SunIcon },
    { label: 'Commercial', icon: ShoppingBagIcon },
    { label: 'Go downs', icon: ArchiveBoxIcon },
    { label: 'Legal', icon: ScaleIcon },
    { label: 'Search', icon: MagnifyingGlassIcon },
];

const MainNavbar = () => (
    <nav className="bg-[#3D3D3D] w-full text-wrap sm:w-[60%] z-50 mx-auto rounded-xl shadow-lg">
        <div className="flex justify-around items-center text-white">
            {navItems.map((item) => (
                <div
                    key={item.label}
                    className={`text-center cursor-pointer p-2 rounded transition duration-200`}
                >
                    <item.icon className={`h-6 w-6 mx-auto ${item.active ? 'text-yellow-600' : 'hover:text-gray-300'}`} />
                    <span className={`${item.active ? 'text-yellow-600' : 'hover:text-gray-300'} text-xs`}>{item.label}</span>
                </div>
            ))}
        </div>
    </nav>
);
export default MainNavbar;