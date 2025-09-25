"use client";
import React from "react";
import HeroSection from "./home/herosection";
import AmenitiesGrid from "./home/amenities";

export default function HomePage() {
    return (
        <div className="w-full rounded-lg bg-[#D79A2F]">
            <div className="p-2 rounded-lg">
                <HeroSection />
            </div>
            <AmenitiesGrid />
        </div>
    );
}
