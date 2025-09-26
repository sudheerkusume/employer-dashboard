"use client";

export default function NewOnHover({ data, cardType, onWatchNowClick, onInfoIconClick, cardIndex, rowPosition, row_name }) {
    return (
        <div
            className={`h-full w-full rounded-r-lg bg-neutral-800 opacity-90 ${cardType === "rectangle" ? "mt-[10px]" : cardType === "vertical-card" ? "mt-0" : cardType === "vertical" ? "-mt-2" : ""
                } ${cardType === "rectangle" ? "pt-[10px]" : cardType === "vertical-card" ? "py-8" : "py-4"}`}
        >
            <div className="px-3">
                <div className="flex items-center justify-between">
                    <p className={`mb-2 text-base font-bold leading-tight text-white ${cardType === "rectangle" ? "line-clamp-1" : ""}`}>
                        {data.name}
                    </p>
                </div>

                <div className={`flex gap-1 py-2 text-xs ${cardType === "vertical" ? "py-2" : ""}`}>
                    <p className="px-1 text-white rounded bg-travelxp-red">{data.type}</p>|
                    <p className="px-1 text-white">{data.price}</p>
                </div>

                <p
                    className={`line-clamp-2 text-xs opacity-70 text-white ${cardType === "vertical" ? "line-clamp-5 pt-2" : "line-clamp-2"
                        } ${cardType === "rectangle" ? "lg:mb-1 xl:mb-2" : "mb-5"}`}
                >
                    {data.description || "No description available."}
                </p>

                <div className={`flex items-center gap-3 ${cardType === "vertical" ? "absolute bottom-10" : ""}`}>
                    <div className="flex gap-2">
                        <button
                            title="View Details"
                            onClick={() => onWatchNowClick(data, "watch", cardIndex, cardType, row_name, rowPosition)}
                            className="flex items-center gap-1 bg-[#D79A2F] border border-white rounded-md bg-travelxp-red px-3 py-[8px] text-xs font-semibold text-white"
                        >
                            View Details
                        </button>

                        <button
                            title="Property Info"
                            onClick={() => onInfoIconClick(data, cardIndex, cardType, row_name, rowPosition)}
                            className="rounded border text-white border-white px-4 py-[6px]"
                        >
                            i
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
