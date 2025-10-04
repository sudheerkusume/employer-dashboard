"use client";

export default function NewOnHover({
    data,
    cardType,
    onWatchNowClick,
    onInfoIconClick,
    cardIndex,
    rowPosition,
    row_name,
    lang
}) {
    const isCountry = lang === "country";

    // ---------- COUNTRY INFO ----------
    const city = data?.city || "Unknown City";
    const propertyTypes = data?.properties?.map(
        (p) => p.type.charAt(0).toUpperCase() + p.type.slice(1)
    ) || [data?.type.charAt(0).toUpperCase() + data?.type.slice(1)];

    const prices = data?.properties?.map((p) => p.price) || [data?.price];
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const currency = data?.currency || "";
    const budgetRange = minPrice && maxPrice
        ? `${currency} ${minPrice.toLocaleString()} - ${currency} ${maxPrice.toLocaleString()}`
        : "Budget Not Available";

    // ---------- CITY INFO ----------
    const location = `${data?.city || ""}${data?.state ? `, ${data?.state}` : ""}, ${data?.country || ""}${data?.region ? ` (${data?.region})` : ""}`;
    const price = data?.price ? `${data?.currency || ""} ${data?.price.toLocaleString()}` : "Price Not Available";
    const status = data?.status || "Status Unknown";
    const area = data?.area_sq_ft ? `${data?.area_sq_ft} sq.ft` : "Area N/A";
    const bedrooms = data?.bedrooms ? `${data?.bedrooms} BHK` : "";
    const bathrooms = data?.bathrooms ? `${data?.bathrooms} Bath` : "";
    const furnishing = data?.furnishing ? data?.furnishing.replace("_", " ") : "N/A";
    const amenities = data?.amenities?.length ? data?.amenities.join(", ") : "N/A";
    const rera_no = data?.rera_no || "N/A";
    const block = data?.block || "N/A";
    const floor_no = data?.floor_no || "N/A";
    const flat_no = data?.flat_no || "N/A";
    const description = data?.description || "No description available.";

    return (
        <div
            className={`h-full w-full rounded-r-lg bg-neutral-900 opacity-95 ${cardType === "rectangle" ? "mt-[10px] pt-[10px]" : "py-4"}`}
        >
            <div className="px-3">
                {isCountry ? (
                    <>
                        {/* Country/City Name */}
                        <p className="mb-2 text-base font-bold leading-tight text-white line-clamp-2">
                            {city}
                        </p>

                        {/* Property Types */}
                        <p className="text-xs text-gray-300 mb-1">
                            <span className="font-semibold">Property Types: </span>
                            {propertyTypes.join(", ")}
                        </p>

                        {/* Budget Range */}
                        <p className="text-xs text-gray-300 mb-2">
                            <span className="font-semibold">Budget: </span>
                            {budgetRange}
                        </p>
                    </>
                ) : (
                    <>
                        {/* Property Name */}
                        <p className="mb-2 text-base font-bold leading-tight text-white line-clamp-2">
                            {data?.name}
                        </p>

                        {/* Status & Price */}
                        <div className="flex gap-2 items-center text-xs mb-2">
                            <span className="px-2 py-1 bg-green-600 rounded text-white font-semibold">{status}</span>
                            <span className="text-white">{price}</span>
                        </div>

                        {/* Basic Info */}
                        <div className="flex flex-wrap gap-2 text-xs mb-2 text-white">
                            {bedrooms && <span className="px-1 bg-blue-600 rounded">{bedrooms}</span>}
                            {bathrooms && <span className="px-1 bg-blue-600 rounded">{bathrooms}</span>}
                            {area && <span className="px-1 bg-blue-600 rounded">{area}</span>}
                            {furnishing && <span className="px-1 bg-blue-600 rounded">{furnishing}</span>}
                        </div>

                        {/* Location */}
                        <p className="text-xs text-gray-300 mb-2">{location}</p>

                        {/* RERA/Block/Floor/Flat */}
                        <div className="text-xs text-gray-400 mb-2">
                            <p>RERA No: {rera_no}</p>
                            <p>Block: {block} | Floor: {floor_no} | Flat: {flat_no}</p>
                        </div>

                        {/* Amenities */}
                        {amenities !== "N/A" && (
                            <p className="text-xs text-gray-300 mb-2">
                                <span className="font-semibold">Amenities: </span>{amenities}
                            </p>
                        )}

                        {/* Description */}
                        <p className="line-clamp-3 text-xs text-gray-300 mb-3">{description}</p>
                    </>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onWatchNowClick(data, "watch", cardIndex, cardType, row_name, rowPosition)}
                        className={`px-3 py-1 text-white text-xs rounded font-semibold ${isCountry ? "bg-red-500" : "bg-travelxp-red"}`}
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onInfoIconClick(data, cardIndex, cardType, row_name, rowPosition)}
                        className="px-2 py-1 border border-white text-white text-xs rounded"
                    >
                        i
                    </button>
                </div>
            </div>
        </div>
    );
}
