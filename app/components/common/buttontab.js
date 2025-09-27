'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function ButtonTab({ tabs, activeTab, setActiveTab }) {
    const [activeIndicator, setActiveIndicator] = useState({});
    const [hoverIndicator, setHoverIndicator] = useState({});
    const tabRefs = useRef([]);

    useEffect(() => {
        // Set initial position of active indicator
        if (tabRefs.current[activeTab]) {
            const tab = tabRefs.current[activeTab];
            setActiveIndicator({
                width: tab.offsetWidth,
                left: tab.offsetLeft,
            });
        }
    }, [activeTab]);

    const handleTabClick = (index) => {
        setActiveTab(index);
        const tab = tabRefs.current[index];
        if (tab) {
            setActiveIndicator({
                width: tab.offsetWidth,
                left: tab.offsetLeft,
            });
        }
    };

    const handleMouseEnter = (index) => {
        const tab = tabRefs.current[index];
        if (tab) {
            setHoverIndicator({
                width: tab.offsetWidth,
                left: tab.offsetLeft,
                opacity: 1,
            });
        }
    };

    const handleMouseLeave = () => {
        setHoverIndicator((prev) => ({ ...prev, opacity: 0 }));
    };

    return (
        <div className="relative w-full">
            {/* Scrollable tabs container */}
            <div
                className="flex overflow-x-auto no-scrollbar bg-white rounded-md relative"
                onMouseLeave={handleMouseLeave}
            >
                {/* Hover indicator */}
                <span
                    className="absolute bottom-0 h-full bg-gray-300 rounded-md transition-all duration-500 ease-in-out z-0"
                    style={{ ...hoverIndicator }}
                ></span>

                {/* Active indicator */}
                <span
                    className="absolute bottom-0 h-full bg-[#D79A2F] rounded-md transition-all duration-500 ease-in-out z-0"
                    style={{ ...activeIndicator }}
                ></span>

                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        ref={(el) => (tabRefs.current[index] = el)}
                        className={`flex-shrink-0 py-2 px-4 cursor-pointer rounded-md relative font-medium z-10
                            transition-colors duration-300 ease-in-out
                            ${activeTab === index ? 'text-white' : 'text-gray-700'}
                        `}
                        onClick={() => handleTabClick(index)}
                        onMouseEnter={() => handleMouseEnter(index)}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
