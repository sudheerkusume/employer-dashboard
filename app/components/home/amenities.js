import { HomeIcon, BuildingOfficeIcon, TruckIcon, AcademicCapIcon, ShoppingCartIcon, CurrencyDollarIcon, PencilSquareIcon, WrenchIcon } from '@heroicons/react/24/outline';

const amenities = [
    { label: 'Bedroom', icon: HomeIcon },
    { label: 'Kitchen', icon: BuildingOfficeIcon }, 
    { label: '24X7 Water Supply', icon: WrenchIcon },
    { label: 'Pharmacy', icon: BuildingOfficeIcon },
    { label: 'Cricket Pitch', icon: AcademicCapIcon },
    { label: 'Bedroom', icon: HomeIcon },
    { label: 'Kitchen', icon: BuildingOfficeIcon }, 
    { label: '24X7 Water Supply', icon: WrenchIcon },
    { label: 'Pharmacy', icon: BuildingOfficeIcon },
    { label: 'Bedroom', icon: HomeIcon },
    { label: 'Kitchen', icon: BuildingOfficeIcon }, 
    { label: '24X7 Water Supply', icon: WrenchIcon },
    { label: 'Pharmacy', icon: BuildingOfficeIcon },
    { label: 'Cricket Pitch', icon: AcademicCapIcon },
    { label: 'Bedroom', icon: HomeIcon },
    { label: 'Kitchen', icon: BuildingOfficeIcon }, 
    { label: '24X7 Water Supply', icon: WrenchIcon },
    { label: 'More...', icon: AcademicCapIcon },
];


const nearby = [
    { label: 'BUS STOP (2KMS)', icon: TruckIcon },
    { label: 'RAILWAY STATION (12 KMS)', icon: TruckIcon },
    { label: 'AIRPORT (9KMS)', icon: TruckIcon },
    { label: 'NEAR BY SCHOOL', icon: AcademicCapIcon },
    { label: 'HOSPITAL (2KMS)', icon: AcademicCapIcon },
    { label: 'SHOPPING MALL', icon: ShoppingCartIcon },
];

const AmenityItem = ({ label, icon: Icon, isNearby }) => (
    <div className={`flex flex-col items-center text-center p-3 m-1 rounded-lg ${isNearby ? 'bg-orange-100' : 'bg-yellow-100'}`}>
        <div className={`p-3 rounded-full ${isNearby ? 'bg-orange-300' : 'bg-yellow-300'}`}>
            <Icon className="h-4 w-4 text-gray-800" />
        </div>
        <span className="mt-2 text-[9px] text-gray-700">{label}</span>
    </div>
);

const AmenitiesGrid = () => (
    <div className="bg-white p-6 sm:rounded-xl sm:shadow-2xl mt-4">
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
            PROJECT AMENITIES
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-9 gap-4">
            {/* Amenities Grid */}
            {amenities.map((item, index) => (
                <AmenityItem key={index} label={item.label} icon={item.icon} />
            ))}
        </div>

        <hr className="my-8 border-gray-200" />

        <div className="grid grid-cols-4 sm:grid-cols-9 gap-4">
            {/* Nearby Locations Grid */}
            {nearby.map((item, index) => (
                <AmenityItem key={index} label={item.label} icon={item.icon} isNearby={true} />
            ))}

            {/* Request Quote Button */}
            <div className="col-span-2 flex text-center flex-col justify-center items-center p-3 bg-gray-600 rounded-lg shadow-md">
                <button className="text-white font-bold text-lg">REQUEST QUOTE</button>
                <p className="text-xs text-gray-100 mt-1">
                    it takes 24-48 hours to get the real-time quote
                </p>
            </div>
        </div>
    </div>
);
export default AmenitiesGrid;