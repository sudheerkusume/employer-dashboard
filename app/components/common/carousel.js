import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useState, useRef, useEffect, cloneElement } from "react";

const Carousel = ({ customArrow, customStyle, children }) => {
    const maxScrollWidth = useRef(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const carousel = useRef(null);
    const visibleCount = 5; // 👈 number of cards visible

    const movePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prevState) => prevState - 1);
        }
    };

    const moveNext = () => {
        if (
            carousel.current !== null &&
            carousel.current.offsetWidth * currentIndex <= maxScrollWidth.current
        ) {
            setCurrentIndex((prevState) => prevState + 1);
        }
    };

    const isDisabled = (direction) => {
        if (direction === "prev") {
            return currentIndex <= 0;
        }

        if (direction === "next" && carousel.current !== null) {
            return (
                carousel.current.offsetWidth * currentIndex >= maxScrollWidth.current
            );
        }

        return false;
    };

    useEffect(() => {
        if (carousel.current) {
            carousel.current.scrollLeft = carousel.current.offsetWidth * currentIndex;
        }
    }, [currentIndex]);

    useEffect(() => {
        maxScrollWidth.current = carousel.current
            ? carousel.current.scrollWidth - carousel.current.offsetWidth
            : 0;
    }, []);

    return (
        <div className="relative items-center touch-auto no-scrollbar group/carousel">
            {/* Buttons */}
            <div className="hidden mt-2.5 lg:absolute lg:inset-0 lg:flex lg:justify-between lg:items-center">
                <button
                    onClick={(e) => { movePrev(); e.stopPropagation(); }}
                    disabled={isDisabled("prev")}
                    className={`${customStyle || ""} ${customArrow ? "" : "rounded-full hover:opacity-100"} absolute left-0 m-0 w-9 p-0 flex items-center justify-center text-black opacity-10 drop-shadow-2xl transition-all duration-300 ease-in-out hover:opacity-100 disabled:opacity-0 z-50`}
                    style={{ top: 0, bottom: 0 }}
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                    onClick={(e) => { moveNext(); e.stopPropagation(); }}
                    disabled={isDisabled("next")}
                    className={`${customStyle || ""} ${customArrow ? "" : "rounded-full hover:opacity-100"} absolute right-0 m-0 w-9 p-0 flex items-center justify-center text-black opacity-10 drop-shadow-2xl transition-all duration-300 ease-in-out hover:opacity-100 disabled:opacity-0 z-50`}
                    style={{ top: 0, bottom: 0 }}
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Carousel */}
            <div
                ref={carousel}
                className="relative flex gap-2 overflow-x-scroll scroll-smooth touch-auto no-scrollbar lg:gap-3 xl:gap-4"
            >
                {children.map((child, index) =>
                    cloneElement(child, {
                        onHover: () => {
                            if (index === currentIndex + visibleCount - 1) {
                                moveNext();
                            } else if (index === currentIndex) {
                                movePrev();
                            }
                        },
                    })
                )}
            </div>
        </div>
    );
};

export default Carousel;
