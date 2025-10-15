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
        <div
            className="flex flex-row justify-between bg-white rounded-t-md relative overflow-hidden"
            onMouseLeave={handleMouseLeave}
        >
            {/* Hover indicator (gray) */}
            <span
                className="absolute bottom-0 h-full bg-gray-200 rounded-t-md transition-all duration-600 ease-in-out z-0"
                style={{
                    ...hoverIndicator,
                }}
            ></span>

            {/* Active indicator (blue) */}
            <span
                className="absolute bottom-0 h-full bg-indigo-900 rounded-t-md transition-all duration-600 ease-in-out z-0"
                style={{
                    ...activeIndicator,
                }}
            ></span>

            {tabs.map((tab, index) => (
                <button
                    key={index}
                    ref={(el) => (tabRefs.current[index] = el)}
                    className={`py-1 px-3 rounded-t-md relative font-medium z-10
                        transition-colors duration-300 ease-in-out
                        ${activeTab === index ? 'text-white' : 'text-gray-700'}
                    `}
                    onClick={() => handleTabClick(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                >
                    <span className="flex flex-wrap items-center justify-center gap-1">
                        <span>{tab.name}</span>
                    </span>
                </button>
            ))}
        </div>
    );
}
