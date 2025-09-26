"use client";
import Image from "next/image";
import { useState } from "react";

export default function ExploreGlobal() {
    const [activeTab, setActiveTab] = useState("Europe");

    const tabs = [
        "Europe",
        "Asia",
        "North America",
        "Middle East",
        "Caribbean",
        "Africa",
        "Australia",
        "South America",
        "Oceania",
    ];

    const cities = [
        { name: "London", img: "/images/image 50.png" },
        { name: "Paris", img: "/images/image 50.png" },
        { name: "Hamburg", img: "/images/image 50.png" },
        { name: "Istanbul", img: "/images/image 50.png" },
        { name: "Amsterdam", img: "/images/image 50.png" },
        { name: "Lisbon", img: "/images/image 50.png" },
        { name: "Rome", img: "/images/image 50.png" },
        { name: "Athens", img: "/images/image 50.png" },
        { name: "Berlin", img: "/images/image 50.png" },
        { name: "Barcelona", img: "/images/image 50.png" },
        { name: "Venice", img: "/images/image 50.png" },
        { name: "Malaga", img: "/images/image 50.png" },
        { name: "Vienna", img: "/images/image 50.png" },
        { name: "Porto", img: "/images/image 50.png" },
        { name: "Stockholm", img: "/images/image 50.png" },
        { name: "Monte Carlo", img: "/images/image 50.png" },
    ];


    return (
        <div className="w-full min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="flex items-center px-3 sm:px-5 gap-3 py-6">
                <div>
                    <Image
                        src="/images/explore.png"
                        alt="globe"
                        width={160}
                        height={60}
                        className="object-contain"
                    />
                </div>
                <h1 className="text-6xl font-bold">GLOBAL</h1>
                <div className="w-20 h-20 flex items-center justify-center">
                    <Image
                        src="/images/globe.png"
                        alt="globe"
                        width={60}
                        height={60}
                        className="object-contain spin-globe"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center space-x-6 text-lg font-medium">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 ${activeTab === tab
                            ? "text-yellow-500 border-b-2 border-yellow-500"
                            : "text-gray-700 hover:text-black"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Cities Grid */}
            <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cities.map((city, index) => (
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
                            <p className="text-sm">150 Featured Sites</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
