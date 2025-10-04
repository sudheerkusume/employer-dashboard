"use client";
import Image from "next/image";
import NewOnHover from "../onhovercard";

export default function RectangleCardTitle({
    item,
    hover = true,
    lang,
    cardType,
    row_name,
    onWatchNowClick,
    onInfoIconClick,
    cardIndex,
    rowPosition,
    lastIndex
}) {
    const getImage = (images, ratio) => {
        if (!images || images.length === 0) return "/images/no_image.svg";
        const matched = images.find((img) => img.aspect === ratio);
        return matched ? matched.image : images[0].image;
    };

    const handleCardClick = () => {
        const safeCity = item.city ? item.city.toLowerCase().replace(/\s+/g, "-") : "listing";
        window.location.href = `/${safeCity}`;
    };

    return (
        <div
            className={`flex relative lg:w-[313px] rounded-xl ${hover ? "group/item transition-all duration-700 ease-in-out hover:w-[626px]" : ""
                } ${lastIndex && "lg:mr-[320px]"}`}
        >
            {/* Left side - Image */}
            <div className="relative pt-[10px] flex">
                <div
                    className="bg-[#edeff3] rounded-lg relative aspect-[16/9] h-24 lg:h-40 xl:h-44 cursor-pointer"
                    onClick={handleCardClick}
                >
                    <Image
                        src={getImage(item.images, "16:9")}
                        alt={item.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-lg lg:group-hover/item:rounded-r-none"
                    />
                </div>
            </div>

            {/* Right side - Hover details */}
            {hover && (
                <div className="group/edit invisible absolute aspect-[16/9] h-24 lg:h-40 xl:h-44 lg:group-hover/item:visible lg:group-hover/item:relative">
                    <NewOnHover
                        data={{
                            ...item,
                            location: `${item.city || ""}${item.state ? `, ${item.state}` : ""
                                }, ${item.country} (${item.region})`,
                            status: item.status,
                            price: item.price,
                            type: item.type,
                        }}
                        cardType={cardType || "rectangle"}
                        onWatchNowClick={onWatchNowClick}
                        onInfoIconClick={onInfoIconClick}
                        cardIndex={cardIndex}
                        rowPosition={rowPosition}
                        row_name={row_name}
                        lang={lang}
                    />
                </div>
            )}
        </div>
    );
}
