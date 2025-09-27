"use client";
import Image from "next/image";
import RectangleCardSwimLane from "../common/cards/reactangleswimline";

export default function ExploreIndia() {
    const properties = [
        {
            id: 1,
            name: "Luxury Apartment in Hyderabad",
            city: "Hyderabad",
            lang: "en",
            path: "en/property/hyderabad-luxury-apartment",
            value: "prop_001",
            images: [
                { aspect: "16:9", image: "/images/hyderabad.png" },
                { aspect: "4:3", image: "/images/hyderabad.png" },
            ],
            price: "₹1.2 Cr",
            type: "Apartment",
        },
        {
            id: 2,
            name: "Beachside Villa in Chennai",
            city: "Chennai",
            lang: "en",
            path: "en/property/chennai-villa",
            value: "prop_002",
            images: [
                { aspect: "16:9", image: "/images/chennai.png" },
                { aspect: "4:3", image: "/images/chennai.png" },
            ],
            price: "₹2.8 Cr",
            type: "Villa",
        },
        {
            id: 3,
            name: "IT Hub Penthouse in Bangalore",
            city: "Bangalore",
            lang: "en",
            path: "en/property/bangalore-penthouse",
            value: "prop_003",
            images: [
                { aspect: "16:9", image: "/images/hyderabad.png" },
                { aspect: "4:3", image: "/images/hyderabad.png" },
            ],
            price: "₹3.5 Cr",
            type: "Penthouse",
        },
        {
            id: 4,
            name: "High-Rise Flat in Mumbai",
            city: "Mumbai",
            lang: "en",
            path: "en/property/mumbai-highrise",
            value: "prop_004",
            images: [
                { aspect: "16:9", image: "/images/mumbai.png" },
                { aspect: "4:3", image: "/images/mumbai.png" },
            ],
            price: "₹4.2 Cr",
            type: "Flat",
        },
        {
            id: 5,
            name: "Modern Duplex in Delhi",
            city: "Delhi",
            lang: "en",
            path: "en/property/delhi-duplex",
            value: "prop_005",
            images: [
                { aspect: "16:9", image: "/images/delhi.png" },
                { aspect: "4:3", image: "/images/delhi.png" },
            ],
            price: "₹2.3 Cr",
            type: "Duplex",
        },
        {
            id: 6,
            name: "Colonial Bungalow in Kolkatta",
            city: "Kolkatta",
            lang: "en",
            path: "en/property/kolkatta-bungalow",
            value: "prop_006",
            images: [
                { aspect: "16:9", image: "/images/chennai.png" },
                { aspect: "4:3", image: "/images/chennai.png" },
            ],
            price: "₹3 Cr",
            type: "Bungalow",
        },
        {
            id: 7,
            name: "Affordable 2BHK in Warangal",
            city: "Warangal",
            lang: "en",
            path: "en/property/warangal-2bhk",
            value: "prop_007",
            images: [
                { aspect: "16:9", image: "/images/hyderabad.png" },
                { aspect: "4:3", image: "/images/hyderabad.png" },
            ],
            price: "₹65 Lakhs",
            type: "Apartment",
        },
    ];
    // Example handlers
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
                <div className="w-24 h-24 flex items-center justify-center">
                    <Image
                        src="/images/india.png"
                        alt="india"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                </div>
            </div>

            <div className="w-full px-5">
                <RectangleCardSwimLane
                    data={properties}
                    lang="en"
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
