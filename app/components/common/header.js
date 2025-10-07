'use client';

import { MapPinIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
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
            setTime(getFormattedTime() || '');
            setDay(getDayName() || '');
        }, 60000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const locRes = await fetch('https://ipapi.co/json/');
                const locData = await locRes.json();
                const city = locData.city || 'Unknown';

                const weatherRes = await fetch(`https://wttr.in/${city}?format=j1`);
                const weatherData = await weatherRes.json();

                const current = weatherData.current_condition[0];
                setWeather({
                    city,
                    temp: current.temp_C,
                    condition: current.weatherDesc[0].value,
                });
            } catch (err) {
                console.error('Weather fetch failed:', err);
                setWeather({ city: 'Unavailable', temp: null, condition: 'Error' });
            }
        };

        fetchWeather();
    }, []);

    return (
        <header className="bg-white w-full text-gray-800 px-4 sm:px-6 py-3 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                {/* Left: Logo */}
                <div className="flex cursor-pointer items-center justify-center sm:justify-start w-full sm:w-auto">
                    <Link href={"/"}>
                        <Image
                            src="/realbeez.png"
                            alt="Realbeez logo"
                            width={200}
                            height={50}
                            priority
                            className="object-contain h-12 sm:h-16"
                        />
                    </Link>
                </div>

                {/* Right: Weather, Time, City, Login */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-end w-full sm:w-auto gap-2 sm:gap-5 text-right">
                    {/* Weather + Day */}
                    <div className="flex flex-col items-end text-right">
                        {weather ? (
                            <div className="flex flex-row-reverse sm:flex-row items-center gap-2 text-gray-700">
                                <div className="text-sm sm:text-base">
                                    <p className="capitalize">
                                        {day}, {weather.condition} {" "}
                                        {weather.temp && (
                                            <span className="font-semibold text-gray-800">
                                                {weather.temp}°C
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Image
                                    src="/icons/weather.png"
                                    alt="weather"
                                    width={28}
                                    height={28}
                                    priority
                                    className="object-contain sm:h-8 sm:w-8"
                                />
                            </div>
                        ) : (
                            <span className="text-xs sm:text-sm text-gray-500">
                                Fetching weather...
                            </span>
                        )}

                        {/* Time + City */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs sm:text-sm text-gray-600">
                            <span className="font-light uppercase">
                                {time} IST |{' '}
                                <span className="font-medium capitalize">
                                    {weather?.city || 'Locating...'}
                                </span>
                            </span>
                            <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        </div>
                    </div>

                    {/* Login Icon */}
                    <div className="flex items-center justify-end">
                        <Image
                            src="/icons/login.png"
                            alt="login"
                            width={40}
                            height={40}
                            priority
                            className="object-contain h-10 sm:h-12 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderNav;
