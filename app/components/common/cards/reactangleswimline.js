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
    watchListIds,
    showPopup,
    userData
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
                        item={item}
                        lang={lang}
                        cardType="rectangle"
                        cardIndex={index}
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
