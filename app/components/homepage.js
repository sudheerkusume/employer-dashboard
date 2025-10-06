"use client";
import React from "react";
import ExploreIndia from "./home/exploreindia";
import ExploreGlobal from "./home/exploreglobe";
import EasyRealEstateSection from "./home/easyrealeste";
import DownloadApp from "./home/downloadapp";

export default function HomePage() {
    return (
        <div className="w-full sm:rounded-lg bg-white">
            <ExploreIndia />
            <EasyRealEstateSection />
            <ExploreGlobal />
            <div className="w-full px-0 sm:px-5">
                <DownloadApp />
            </div>            
        </div>
    );
}
