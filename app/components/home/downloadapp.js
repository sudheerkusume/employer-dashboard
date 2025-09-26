"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/24/outline";

const DownloadApp = () => {
    return (
        <div className="relative flex min-h-screen items-center overflow-hidden bg-white">
            {/* Background Layer */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Left Curve - Wrapping left content */}
                <div className="absolute left-0 top-0 h-full w-1/2 bg-[#f1e28c] rounded-r-full"
                    style={{ clipPath: 'ellipse(100% 70% at 1% 50%)' }} />

                {/* Right Curves - Wrapping mobile image */}
                <div className="absolute right-0 top-0 h-full w-3/5">
                    {/* Outer curve */}
                    <div className="absolute right-0 top-0 h-full w-full bg-[#f1e28c] rounded-l-full"
                        style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }} />

                    {/* Inner curve */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4/5 w-4/5 bg-[#ffc300] rounded-l-full"
                        style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }} />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-7xl mx-auto">
                {/* Left Content */}
                <div className="flex-1 p-8 md:p-16 lg:pl-24 lg:pr-16 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-2">
                        <Image
                            src="/realbeez.png"
                            alt="Realbeez logo"
                            width={160}
                            height={50}
                            priority
                        />
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight mb-8 max-w-lg">
                        Download Our{" "}
                        <span className="text-[#e89d1b]">Real Estate</span> Mobile App
                    </h1>

                    {/* Store Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-12">
                        <Link
                            href="#"
                            className="flex items-center gap-3 justify-center w-48 h-14 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 hover:scale-105"
                        >
                            <PlayIcon className="w-7 h-7 text-yellow-500" />
                            <div className="text-left">
                                <span className="text-xs text-gray-500 block leading-none">
                                    Get It On
                                </span>
                                <span className="text-lg font-semibold block leading-none">
                                    Play Store
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="#"
                            className="flex items-center gap-3 justify-center w-48 h-14 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 hover:scale-105"
                        >
                            <PlayIcon className="w-7 h-7 text-yellow-500" />
                            <div className="text-left">
                                <span className="text-xs text-gray-500 block leading-none">
                                    Get It On
                                </span>
                                <span className="text-lg font-semibold block leading-none">
                                    App Store
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* QR Section */}
                    <div className="flex items-center gap-5 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                            <span className="text-gray-400 text-sm">QR Code</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                            <p className="text-gray-600">Download</p>
                            <p>From Apps Store</p>
                            <p className="font-normal text-gray-600 mt-1">
                                www.real-beez.com
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Content - Mobile Image */}
                <div className="relative flex-1 z-10 flex items-center justify-center p-8 lg:p-16">
                    <div className="relative w-full max-w-md h-[600px] flex justify-center items-center">
                        <div className="absolute w-[280px] h-[540px] -rotate-3 transform">
                            <Image
                                src="/images/mobile.png"
                                alt="Realbee Mobile App"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadApp;