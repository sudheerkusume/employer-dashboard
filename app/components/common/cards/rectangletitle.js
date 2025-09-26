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
    onHover // 👈 coming from Carousel
}) {
    const getImage = (images, ratio) => {
        if (!images || images.length === 0) return "/images/no_image.svg";
        const matched = images.find((img) => img.aspect === ratio);
        return matched ? matched.image : images[0].image;
    };

    const handleCardClick = () => {
        window.location.href = `/${lang}/${item.path}?value=${item.value}`;
    };

    return (
        <div
            className={`flex relative lg:w-[313px] rounded-xl ${hover
                    ? "group/item transition-all duration-700 ease-in-out hover:w-[626px]"
                    : ""
                }`}
            onMouseEnter={onHover} // 👈 auto-slide trigger
        >
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

            {hover && (
                <div className="group/edit invisible absolute aspect-[16/9] h-24 lg:h-40 xl:h-44 lg:group-hover/item:visible lg:group-hover/item:relative">
                    <NewOnHover
                        data={item}
                        cardType={cardType || "rectangle"}
                        onWatchNowClick={onWatchNowClick}
                        onInfoIconClick={onInfoIconClick}
                        cardIndex={cardIndex}
                        rowPosition={rowPosition}
                        row_name={row_name}
                    />
                </div>
            )}
        </div>
    );
}
