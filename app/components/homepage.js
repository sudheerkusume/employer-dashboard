"use client";
import React from "react";
import HeroSection from "./home/herosection";
import AmenitiesGrid from "./home/amenities";
import ExploreIndia from "./home/exploreindia";
import ExploreGlobal from "./home/exploreglobe";
import EasyRealEstateSection from "./home/easyrealeste";
import DownloadApp from "./home/downloadapp";

export default function HomePage() {
    return (
        <div className="w-full sm:rounded-lg bg-[#D79A2F]">
            <div className="p-2 rounded-lg">
                <HeroSection />
            </div>
            <AmenitiesGrid />
            <ExploreIndia />
            <EasyRealEstateSection />
            <ExploreGlobal />
            <DownloadApp />
        </div>
    );
}
