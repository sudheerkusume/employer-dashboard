"use client";
import Image from "next/image";
import NewOnHover from "../onhovercard";
import { useParams } from "next/navigation";

export default function RectangleCardTitle({
    item,
    hover = true,
    type,
    cardType,
    row_name,
    onWatchNowClick,
    onInfoIconClick,
    cardIndex,
    rowPosition,
    lastIndex
}) {
    const { state, city, area } = useParams();
    const getImage = (images, ratio) => {
        if (!images || images.length === 0) return "/images/no_image.svg";
        const matched = images.find((img) => img.aspect_ratio === ratio);
        return matched ? (matched.url || matched.image) : (images[0].url || images[0].image);
    };

    const handleCardClick = () => {
        const safeCountry = item.country ? item.country.toLowerCase().replace(/\s+/g, "-") : "country";
        const safeState = item.state ? item.state.toLowerCase().replace(/\s+/g, "-") : "state";
        const safeCity = item.city ? item.city.toLowerCase().replace(/\s+/g, "-") : "city";
        const safeArea = item.area ? item.area.toLowerCase().replace(/\s+/g, "-") : "area";
        const safeId = item.id ? item.id : "id";

        let targetUrl = "/";
        if (type === "country") {
            targetUrl = `/${safeState}`;
        } else if (type === "state") {
            targetUrl = `/${safeState}/${safeCity}`;
        } else if (type === "city") {
            targetUrl = `/${safeState}/${safeCity}/${safeArea}`;
        } else {
            targetUrl = `/${safeState}/${safeCity}/${safeArea}/${safeId}`;
        }

        window.location.href = targetUrl;
    };


    return (
        <div
            // *** FIX APPLIED HERE: Added transform translate-x-0 for smooth exit transition ***
            className={`flex relative lg:w-[313px] rounded-xl transform translate-x-0 ${hover ? "transition-all duration-700 ease-in-out group/item hover:w-[626px]" : ""
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
                        type={type}
                    />
                </div>
            )}
        </div>
    );
}