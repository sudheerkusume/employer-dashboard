"use client";
import Image from "next/image";
import { useState } from "react";
import ButtonTab from "../common/buttontab";
import GlobeChart from "../common/globechar";

export default function ExploreGlobal() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { name: "Europe" },
        { name: "Asia" },
        { name: "North America" },
        { name: "Middle East" },
        { name: "Caribbean" },
        { name: "Africa" },
        { name: "Australia" },
        { name: "South America" },
        { name: "Oceania" },
    ];

    // Group cities by region with dummy real-estate related data
    const regionCities = {
        Europe: [
            { name: "London", img: "/images/image 50.png", properties: 120 },
            { name: "Paris", img: "/images/image 50.png", properties: 95 },
            { name: "Rome", img: "/images/image 50.png", properties: 80 },
            { name: "Berlin", img: "/images/image 50.png", properties: 70 },
        ],
        Asia: [
            { name: "Chennai", img: "/images/chennai.png", properties: 75 },
            { name: "Tokyo", img: "/images/image 50.png", properties: 110 },
            { name: "Mumbai", img: "/images/mumbai.png", properties: 90 },
            { name: "Bangkok", img: "/images/image 50.png", properties: 90 },
            { name: "Singapore", img: "/images/image 50.png", properties: 60 },
            { name: "Delhi", img: "/images/delhi.png", properties: 60 },
            { name: "Dubai", img: "/images/image 50.png", properties: 75 },
            { name: "Hyderabad", img: "/images/hyderabad.png", properties: 110 },
        ],
        "North America": [
            { name: "New York", img: "/images/image 50.png", properties: 140 },
            { name: "Los Angeles", img: "/images/image 50.png", properties: 100 },
            { name: "Toronto", img: "/images/image 50.png", properties: 85 },
            { name: "Chicago", img: "/images/image 50.png", properties: 65 },
        ],
        "Middle East": [
            { name: "Dubai", img: "/images/image 50.png", properties: 80 },
            { name: "Abu Dhabi", img: "/images/image 50.png", properties: 50 },
            { name: "Doha", img: "/images/image 50.png", properties: 45 },
        ],
        Caribbean: [
            { name: "Havana", img: "/images/image 50.png", properties: 30 },
            { name: "Nassau", img: "/images/image 50.png", properties: 25 },
            { name: "Kingston", img: "/images/image 50.png", properties: 20 },
        ],
        Africa: [
            { name: "Cape Town", img: "/images/image 50.png", properties: 60 },
            { name: "Johannesburg", img: "/images/image 50.png", properties: 55 },
            { name: "Nairobi", img: "/images/image 50.png", properties: 40 },
        ],
        Australia: [
            { name: "Sydney", img: "/images/image 50.png", properties: 70 },
            { name: "Melbourne", img: "/images/image 50.png", properties: 60 },
            { name: "Brisbane", img: "/images/image 50.png", properties: 45 },
        ],
        "South America": [
            { name: "Rio de Janeiro", img: "/images/image 50.png", properties: 65 },
            { name: "Buenos Aires", img: "/images/image 50.png", properties: 55 },
            { name: "Santiago", img: "/images/image 50.png", properties: 50 },
        ],
        Oceania: [
            { name: "Auckland", img: "/images/image 50.png", properties: 35 },
            { name: "Wellington", img: "/images/image 50.png", properties: 25 },
            { name: "Fiji", img: "/images/image 50.png", properties: 20 },
        ],
    };

    // Get cities of active tab
    const currentCities = regionCities[tabs[activeTab].name] || [];

    return (
        <div className="w-full min-h-screen bg-white font-sans">
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
