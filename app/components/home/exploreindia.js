"use client";
import Image from "next/image";
import RectangleCardSwimLane from "../common/cards/reactangleswimline";
import { realEstateData } from "../config/data";

export default function ExploreIndia() {
    // Create a map to track unique cities
    const stateMap = new Map();

    // Filter India properties and keep only the first property per state
    const properties = realEstateData
        .filter((item) => item.address.country.toLocaleLowerCase() === "india")
        .filter((item) => {
            if (!stateMap.has(item.address.state)) {
                stateMap.set(item.address.state, true);
                return true; // keep first property of the state
            }
            return false; // skip other properties from the same state
        })
        .map((item) => ({
            id: item.id,
            name: item.title,
            description: item.description,
            state: item.address.state,
            city: item.address.city,
            area: item.address.area,
            path: `/${item.address.country.toLowerCase()}/${item.address.city.toLowerCase()}-${item.type.toLowerCase()}-${item.id}`,
            value: `prop_${item.id}`,
            images: item.images?.map((img) => ({
                aspect: img.aspect_ratio || "16:9",
                image: img.url || "/images/placeholder.png",
            })) || [
                    { aspect: "16:9", image: "/images/placeholder.png" },
                    { aspect: "4:3", image: "/images/placeholder.png" },
                ],
            price: `${item.currency} ${item.price.toLocaleString()}`,
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
            status: item.status,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            furnishing: item.furnishing,
            amenities: item.amenities,
        }));

    // Handlers
    const handleWatchNowClick = (data) => {
        console.log("Watch now clicked:", data);
    };

    const handleInfoIconClick = (data) => {
        console.log("Info clicked:", data);
    };

    return (
        <div className="w-full bg-white font-sans">
            {/* Header */}
            <div className="flex items-center px-5 sm:px-5 py-6 -space-x-5">
                <Image
                    src="/images/explore.png"
                    alt="explore"
                    width={160}
                    height={60}
                    className="object-contain z-10"
                />
                <Image
                    src="/images/india.png"
                    alt="india"
                    width={100}
                    height={100}
                    className="object-contain"
                />
            </div>

            {/* Properties List */}
            <div className="w-full h-full px-5">
                <RectangleCardSwimLane
                    data={properties}
                    type={"country"}
                    rowPosition={0}
                    onWatchNowClick={handleWatchNowClick}
                    onInfoIconClick={handleInfoIconClick}
                    watchListIds={[]}
                    showPopup={false}
                    userData={properties}
                />
            </div>
        </div>
    );
}
