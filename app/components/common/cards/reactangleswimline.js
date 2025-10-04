"use client";
import React from "react";
import RectangleCardTitle from "./rectangletitle";
import Carousel from "../carousel";

export default function RectangleCardSwimLane({
    data,
    lang,
    rowPosition,
    onWatchNowClick,
    onInfoIconClick,
}) {
    return (
        <div className="relative">
            <Carousel
                customArrow={true}
                customStyle="bg-gray-300 text-white"
                showOnhover={true}
            >
                {data.map((item, index) => (
                    <RectangleCardTitle
                        key={item.id}
                        item={{
                            ...item,
                            name: item.name,
                            city: item.city || "",
                            state: item.state || "",
                            country: item.country,
                            region: item.region,
                            price: item.price,
                            type: item.type,
                            status: item.status,
                            path: `/${"india"}/${item.city?.toLowerCase() || "listing"}-${item.id}`,
                            images: item.images?.length
                                ? item.images
                                : [
                                    { aspect: "16:9", image: "/images/default.png" },
                                    { aspect: "4:3", image: "/images/default.png" },
                                ],
                        }}
                        lang={lang}
                        cardType="rectangle"
                        cardIndex={index}
                        lastIndex={index === data.length - 1}
                        rowPosition={rowPosition}
                        row_name={item.name}
                        onWatchNowClick={onWatchNowClick}
                        onInfoIconClick={onInfoIconClick}
                        hover={true}
                    />
                ))}
            </Carousel>
        </div>
    );
}
