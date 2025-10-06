"use client";
import Image from "next/image";
import { realEstateData } from "./config/data";
import RectangleCardSwimLane from "./common/cards/reactangleswimline";
import { useParams } from "next/navigation";

export default function ExploreCity() {
    const { city, area } = useParams();
    // Filter India properties and keep only the first property per city
    const properties = realEstateData
        .filter((item) => item.address.city.toLocaleLowerCase() === city).map((item) => ({
            id: item.id,
            name: item.title,
            description: item.description,
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
            <div className="flex items-center px-5 sm:px-5 py-6">
                <div>
                    <Image
                        src="/images/explore.png"
                        alt="explore"
                        width={160}
                        height={60}
                        className="object-contain"
                    />
                </div>
                <div className="w-32 h-32 flex items-center justify-center">
                    <Image
                        src={`/images/${city}-map.png`}
                        alt={city || "city"}
                        width={100}
                        height={100}
                        className="object-contain bg-white"
                    />
                </div>
            </div>

            {/* Properties List */}
            <div className="w-full h-full px-5">
                <RectangleCardSwimLane
                    data={properties}
                    type={"city"}
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
