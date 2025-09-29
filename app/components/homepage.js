"use client";
import React from "react";
import AmenitiesGrid from "./home/amenities";
import ExploreIndia from "./home/exploreindia";
import ExploreGlobal from "./home/exploreglobe";
import EasyRealEstateSection from "./home/easyrealeste";
import DownloadApp from "./home/downloadapp";
import Footer from "./common/footer";

export default function HomePage() {
    return (
        <div className="w-full sm:rounded-lg bg-white">
            <AmenitiesGrid />
            <ExploreIndia />
            <EasyRealEstateSection />
            <ExploreGlobal />
            <div className="w-full px-0 sm:px-4">
                <DownloadApp />
            </div>
            <Footer/>
        </div>
    );
}
