'use client';

import { useContext, useMemo } from 'react';
import Image from 'next/image';
import Slider from '../common/slider';
import RootContext from '../config/rootcontext';
import { realEstateData } from '../config/data';

const HeroSection = () => {
    const { rootContext } = useContext(RootContext);

    // ✅ Filter data dynamically by country/city/area and rootContext.active
    const filteredData = useMemo(() => {
        const { selectedLocation, active } = rootContext || {};

        return realEstateData.filter((item) => {
            const addr = item.address || {};

            // 1. Location Filter
            const passesLocationFilter = !selectedLocation || (
                (!selectedLocation.country || addr.country?.toLowerCase() === selectedLocation.country.toLowerCase()) &&
                (!selectedLocation.city || addr.city?.toLowerCase() === selectedLocation.city.toLowerCase()) &&
                (!selectedLocation.area || addr.area?.toLowerCase() === selectedLocation.area.toLowerCase())
            );

            if (!passesLocationFilter) return false;

            // 2. Active Context Filter (New Logic)
            if (active) {
                if (active === 'all' || active === 'search') {
                    // Display properties with priority "medium" or "high"
                    return item.priority === 'medium' || item.priority === 'high';
                } else {
                    // Filter as per rootContext.active (assuming it is the property 'type')
                    return item.type?.toLowerCase() === active.toLowerCase();
                }
            }

            // If all filters pass (or are not set), include the item
            return true;
        });
        // IMPORTANT: Added rootContext.active to the dependency array
    }, [rootContext.selectedLocation, rootContext.active]);

    // ✅ Build sliderData dynamically from filtered properties
    const sliderData = useMemo(() => {
        return filteredData.flatMap((property) =>
            property.images?.map((img) => ({ image: img.url })) || []
        );
    }, [filteredData]);

    const displayTitle =
        filteredData[0]?.title
            ? `${filteredData[0].title?.toUpperCase() || ''}`
            : 'Properties';

    const activeLabel =
        rootContext.active === 'all' || rootContext.active === 'search'
            ? 'Properties'
            : rootContext.active;

    const displayAddress =
        filteredData[0]?.address
            ? `${filteredData[0].address.area?.toUpperCase() || ''}, ${filteredData[0].address.city?.toUpperCase() || ''}, ${filteredData[0].address.state?.toUpperCase() || ''}`
            : 'INDIA';


    return (
        <div className="relative h-auto overflow-hidden bg-[#D79A2F]">

            <div className="p-2 justify-center items-center sm:p-8 flex flex-col justify-start text-white">
                <h1 className="text-lg sm:text-4xl font-bold sm:font-extrabold sm:mt-4 z-10 uppercase">
                    {`${displayTitle}`}
                </h1>
                <p className="text-xs sm:text-md sm:mt-2 z-10">
                    {displayAddress}
                </p>
            </div>
            {/* Dynamic Background Slider */}
            <div className="p-2 sm:rounded-lg">
                <Slider
                    data={sliderData.length ? sliderData : [{ image: '/images/default.jpg' }]}
                    rounded="sm:rounded-lg"
                    className="h-[260px] sm:h-[600px] sm:rounded-lg"
                    fitMode="cover"
                />
            </div>

            {/* Sidebar Buttons */}
            <div className="absolute right-2 sm:right-4 top-0 sm:top-[20%] z-20 flex flex-col items-center justify-center space-y-1 sm:space-y-3 text-center">
                {/* VR Button */}
                <div className="relative w-18 sm:w-24 flex items-center justify-center cursor-pointer">
                    <Image
                        src="/images/vr.png"
                        alt="VR logo"
                        width={160}
                        height={40}
                        priority
                        className="object-contain h-16 sm:h-24"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-yellow-500 font-semibold text-md sm:font-bold sm:text-xl">
                        VR
                    </span>
                </div>

                {/* Action Buttons */}
                {[
                    { icon: '/icons/broucher.png', label: 'BROCHURE' },
                    { icon: '/icons/playicon.png', label: 'VIDEOS' },
                    { icon: '/icons/plan.png', label: '3D PLAN' },
                ].map((btn, i) => (
                    <button
                        key={i}
                        className="flex w-20 h-16 sm:w-32 sm:h-20 flex-col cursor-pointer items-center justify-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs sm:text-lg font-semibold sm:font-bold hover:opacity-80 transition"
                    >
                        <Image
                            src={btn.icon}
                            alt={btn.label}
                            width={40}
                            height={20}
                            priority
                            className="object-contain h-5 sm:h-8"
                        />
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HeroSection;