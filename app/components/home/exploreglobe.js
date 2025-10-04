"use client";
import Image from "next/image";
import { useState, useMemo } from "react";
import ButtonTab from "../common/buttontab";
import GlobeChart from "../common/globechar";
import { realEstateData } from "../config/data";

export default function ExploreGlobal() {
    const [activeTab, setActiveTab] = useState(0);

    // Tabs based on regions
    const tabs = [
        { name: "Asia" },
        { name: "Europe" },
        { name: "North America" },
        { name: "Africa" },
        { name: "Oceania" },
        { name: "Middle East" },
        { name: "Caribbean" },
        { name: "South America" },
        { name: "Central America" },
    ];

    // Memoize grouped cities by region
    const regionCities = useMemo(() => {
        const grouped = {};

        realEstateData.forEach((item) => {
            if (!grouped[item.region]) grouped[item.region] = {};

            const cityName = item.address.city;
            if (!grouped[item.region][cityName]) {
                grouped[item.region][cityName] = {
                    name: cityName,
                    img: item.images?.[0]?.url || "/images/placeholder.png",
                    properties: 0,
                };
            }

            // Sum number of units per city
            grouped[item.region][cityName].properties += item.no_of_units || 1;
        });

        // Convert grouped objects to array
        const result = {};
        for (const region in grouped) {
            result[region] = Object.values(grouped[region]);
        }
        return result;
    }, []);

    const currentCities = regionCities[tabs[activeTab].name] || [];

    return (
        <div className="w-full bg-white font-sans">
            {/* Header */}
            <div className="flex items-center px-3 sm:px-5 py-6">
                <div>
                    <Image
                        src="/images/explore.png"
                        alt="globe"
                        width={160}
                        height={60}
                        className="object-contain"
                    />
                    <h1 className="text-5xl font-bold">GLOBAL</h1>
                </div>
                <GlobeChart />
            </div>

            {/* Tabs */}
            <div className="px-5">
                <ButtonTab tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Cities Grid */}
            <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentCities.map((city, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden shadow-md">
                        <Image
                            src={city.img}
                            alt={city.name}
                            width={400}
                            height={300}
                            className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 text-white">
                            <h3 className="text-lg font-bold">{city.name}</h3>
                            <p className="text-sm">{city.properties} Featured Properties</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
