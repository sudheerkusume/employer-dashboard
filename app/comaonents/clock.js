import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        let frameId;
        const tick = () => {
            setTime(new Date());
            frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, []);

    const getHandRotation = (unit, total) => (unit / total) * 360;

    const seconds = time.getSeconds() + time.getMilliseconds() / 1000; // smooth
    const minutes = time.getMinutes() + seconds / 60;
    const hours = (time.getHours() % 12) + minutes / 60;

    const secondDegrees = getHandRotation(seconds, 60);
    const minuteDegrees = getHandRotation(minutes, 60);
    const hourDegrees = getHandRotation(hours, 12);

    return (
        <div className="flex items-center justify-center">
            <div className="relative w-[220px] h-[220px] rounded-full border-[6px] border-gray-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-gradient-to-b from-gray-800 to-gray-900">
                {/* Clock numbers */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map((number) => {
                    const angle = (number * 30 - 90) * (Math.PI / 180);
                    const radius = 90;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    return (
                        <div
                            key={number}
                            className="absolute text-lg font-bold text-[#D79A2F] drop-shadow-[0_0_6px_rgba(255,255,0,0.7)]"
                            style={{
                                top: "50%",
                                left: "50%",
                                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                            }}
                        >
                            {number}
                        </div>
                    );
                })}

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#D79A2F] rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30" />

                {/* Hour hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-[6px] h-[60px] bg-[#D79A2F] rounded-full"
                    style={{
                        transformOrigin: "center bottom",
                        translateX: "-50%",
                        translateY: "-100%",
                        rotate: hourDegrees,
                    }}
                />

                {/* Minute hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-[4px] h-[80px] bg-white/80 rounded-full"
                    style={{
                        transformOrigin: "center bottom",
                        translateX: "-50%",
                        translateY: "-100%",
                        rotate: minuteDegrees,
                    }}
                />

                {/* Second hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-[2px] h-[95px] bg-red-500 rounded-full"
                    style={{
                        transformOrigin: "center bottom",
                        translateX: "-50%",
                        translateY: "-100%",
                        rotate: secondDegrees,
                    }}
                />
            </div>
        </div>
    );
};

export default Clock;
