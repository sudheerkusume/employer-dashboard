import React, { useCallback, useEffect, useState } from "react";

function Slider({ data, imageSize = "400px", rounded }) {
    const [currentSlide, setCurrentSlide] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(true);

    // Clone first and last slides for infinite loop
    const slides = [data[data.length - 1], ...data, data[0]];

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => prev + 1);
        setIsTransitioning(true);
    }, []);

    // Auto-scroll
    useEffect(() => {
        const autoScrollInterval = setInterval(nextSlide, 3000);
        return () => clearInterval(autoScrollInterval);
    }, [nextSlide]);

    // Handle reset after transition ends
    const handleTransitionEnd = () => {
        if (currentSlide === slides.length - 1) {
            setIsTransitioning(false);
            setCurrentSlide(1); // reset to first real slide
        } else if (currentSlide === 0) {
            setIsTransitioning(false);
            setCurrentSlide(slides.length - 2); // reset to last real slide
        } else {
            setIsTransitioning(true);
        }
    };

    // Jump to selected slide from dots
    const goToSlide = (index) => {
        setCurrentSlide(index + 1); // +1 because of cloned first slide
        setIsTransitioning(true);
    };

    return (
        <div className={`relative w-full bg-[#D79A2F] overflow-hidden ${rounded}`}>
            <div className="relative w-full" style={{ height: imageSize }}>
                {/* ✅ Status label */}
                {data[currentSlide - 1]?.status && (
                    <span className="absolute top-3 left-3 bg-orange-300 text-white text-[9px] font-semibold px-3 border border-white py-1 z-10">
                        {data[currentSlide - 1]?.status}
                    </span>
                )}

                {/* Slides wrapper */}
                <div
                    className={`flex ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {slides.map((item, index) => (
                        <div key={index} className="relative flex-none w-full h-full">
                            <div className="w-full" style={{ height: imageSize }}>
                                {item?.image ? (
                                    <img
                                        src={item.image}
                                        alt={`carousel-${index}`}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <img
                                        src="https://images.travelxp.com/images/txpin/vector/general/errorimage.svg"
                                        alt="error"
                                        className="object-cover w-full h-full"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ✅ Dots Indicator */}
            {data?.length > 1 && (
                <div className="absolute bottom-3 cursor-pointer left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                    {data.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full ${currentSlide - 1 === index ? "bg-white" : "bg-gray-400"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Slider;
