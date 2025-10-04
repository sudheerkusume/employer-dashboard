"use client";
import Image from "next/image";
import { realEstateData } from "./config/data";
import RectangleCardSwimLane from "./common/cards/reactangleswimline";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";

export default function ExploreArea() {
    const { city, area } = useParams();
    const [selectedArea, setSelectedArea] = useState(area || "All");

    // Filter properties for the city
    const cityProperties = useMemo(() => {
        return realEstateData.filter(
            (item) => item.address.city.toLowerCase() === city.toLowerCase()
        );
    }, [city]);

    // Collect unique areas in this city
    const availableAreas = useMemo(() => {
        const set = new Set();
        cityProperties.forEach((item) => set.add(item.address.area));
        return ["All", ...Array.from(set)];
    }, [cityProperties]);

    // Apply area filter
    const properties = useMemo(() => {
        return cityProperties
            .filter((item) =>
                selectedArea === "All"
                    ? true
                    : item.address.area.toLowerCase() === selectedArea.toLowerCase()
            )
            .map((item) => ({
                id: item.id,
                name: item.title,
                description: item.description,
                city: item.address.city,
                area: item.address.area,
                lang: "en",
                path: `/${item.address.country.toLowerCase()}/${item.address.city.toLowerCase()}-${item.type.toLowerCase()}-${item.id}`,
                value: `prop_${item.id}`,
                images:
                    item.images?.map((img) => ({
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
    }, [cityProperties, selectedArea]);

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
            <div className="flex items-center px-3 sm:px-5 py-6">
                <div>
                    <Image
                        src="/images/explore.png"
                        alt="globe"
                        width={160}
                        height={60}
                        className="object-contain"
                    />
                    <h1 className="text-5xl font-bold uppercase">{area || ""}</h1>
                </div>
            </div>

            {/* Area Filter */}
            <div className="px-5 mb-4">
                <select
                    className="border px-3 py-2 rounded"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                >
                    {availableAreas.map((area, idx) => (
                        <option key={idx} value={area}>
                            {area}
                        </option>
                    ))}
                </select>
            </div>

            {/* Properties List */}
            <div className="w-full h-full px-5">
                <RectangleCardSwimLane
                    data={properties}
                    type={"area"}
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
