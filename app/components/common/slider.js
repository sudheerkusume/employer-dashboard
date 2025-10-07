import React, { useCallback, useEffect, useState } from "react";

function Slider({ data, rounded, className, fitMode = "cover" }) {
    const [currentSlide, setCurrentSlide] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(true);

    // Clone first and last slides for infinite loop
    const slides = [data[data.length - 1], ...data, data[0]];
    const dataLength = data.length;

    // Calculate the correct index for the original 'data' array (0-based)
    const dataIndex = (currentSlide - 1 + dataLength) % dataLength;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => prev + 1);
        setIsTransitioning(true);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (dataLength <= 1) return;
        const autoScrollInterval = setInterval(nextSlide, 3000);
        return () => clearInterval(autoScrollInterval);
    }, [nextSlide, dataLength]);

    // Handle reset after transition ends
    const handleTransitionEnd = () => {
        if (currentSlide === slides.length - 1) {
            setIsTransitioning(false);
            setCurrentSlide(1);
        } else if (currentSlide === 0) {
            setIsTransitioning(false);
            setCurrentSlide(slides.length - 2);
        } else {
            setIsTransitioning(true);
        }
    };

    // Jump to selected slide from dots
    const goToSlide = (index) => {
        setCurrentSlide(index + 1);
        setIsTransitioning(true);
    };



    return (
        <div className={`relative w-full bg-[#D79A2F] overflow-hidden ${rounded} ${className}`}>
            <div className={`relative w-full h-full ${rounded}`}>
                {/* Status label */}
                {data[dataIndex]?.status && (
                    <span className="absolute top-3 left-3 bg-orange-300 text-white text-[9px] font-semibold px-3 border border-white py-1 z-10">
                        {data[dataIndex]?.status}
                    </span>
                )}

                {/* Slides wrapper */}
                <div
                    className={`${rounded} flex ${isTransitioning ? "transition-transform duration-700 ease-in-out" : `${rounded}`}`}
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {slides.map((item, index) => (
                        <div
                            key={index}
                            className={`${rounded} relative flex items-center justify-center flex-none w-full h-auto sm:h-screen bg-black`}
                        >
                            {item?.image ? (
                                <img
                                    src={item.image}
                                    alt={`carousel-${index}`}
                                    className={
                                        fitMode === "contain"
                                            ? `${rounded} h-full w-auto object-contain`
                                            : `${rounded} w-full h-full object-cover`
                                    }
                                />
                            ) : (
                                <img
                                    src="https://images.travelxp.com/images/txpin/vector/general/errorimage.svg"
                                    alt="error"
                                    className={
                                        fitMode === "contain"
                                            ? `${rounded} h-full w-auto object-contain`
                                            : `${rounded} w-full h-full object-cover`
                                    }
                                />
                            )}
                        </div>
                    ))}

                </div>
            </div>

            {/* Dots Indicator */}
            {data?.length > 1 && (
                <div className="absolute bottom-10 cursor-pointer left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                    {data.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full ${dataIndex === index ? "bg-white" : "bg-gray-400"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Slider;
