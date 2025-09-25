'use client';

import { ArrowRightOnRectangleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
        hour12: true,
    });
};

const getDayName = () => {
    return new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        timeZone: 'Asia/Kolkata',
    });
};

const HeaderNav = () => {
    const [time, setTime] = useState(getFormattedTime());
    const [weather, setWeather] = useState(null);
    const [day, setDay] = useState(getDayName());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(getFormattedTime());
            setDay(getDayName());
        }, 60000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const locRes = await fetch("https://ipapi.co/json/");
                const locData = await locRes.json();
                const city = locData.city || "Unknown";

                const weatherRes = await fetch(`https://wttr.in/${city}?format=j1`);
                const weatherData = await weatherRes.json();

                const current = weatherData.current_condition[0];
                setWeather({
                    city,
                    temp: current.temp_C,
                    condition: current.weatherDesc[0].value,
                });
            } catch (err) {
                console.error("Weather fetch failed:", err);
                setWeather({ city: "Unavailable", temp: null, condition: "Error" });
            }
        };

        fetchWeather();
    }, []);

    return (
        <header className="bg-white w-full text-gray-800 py-3 shadow-md">
            <div className="w-full sm:w-[90%] mx-auto flex justify-between items-center gap-6">
                {/* Logo */}
                <div className="flex cursor-pointer items-center">
                    <Image
                        src="/realbeez.png"
                        alt="logo"
                        width={220}
                        height={90}
                        priority
                        className="object-contain h-auto sm:h-26"
                    />
                </div>

                {/* Right section */}
                <div className="relative w-full sm:w-auto flex flex-col items-end space-y-2">
                    {/* Login Icon - always top-right */}
                    <div className="absolute top-0 right-0 sm:static">
                        <Image
                            src="/icons/login.png"
                            alt="login"
                            width={48}
                            height={40}
                            priority
                            className="object-contain h-auto sm:h-12 cursor-pointer"
                        />
                    </div>

                    {/* Weather + Day */}
                    {weather ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2">
                            <span className="text-gray-500 text-sm sm:text-base">{day}, {weather.condition}</span>
                            {weather.temp && <span className="font-bold text-sm sm:text-base">{weather.temp}°C</span>}
                            <Image
                                src="/icons/weather.png"
                                alt="weather"
                                width={30}
                                height={30}
                                priority
                                className="object-contain h-auto sm:h-12"
                            />
                        </div>
                    ) : (
                        <span className="text-sm">Fetching weather...</span>
                    )}

                    {/* Time + City */}
                    <div className="flex items-center space-x-1 text-xs sm:text-sm">
                        <span className="font-light">{time} IST | {weather?.city || "Locating..."}</span>
                        <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderNav;
