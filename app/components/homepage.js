'use client'
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function HomePage() {
    const playerRef = useRef(null);
    const videoNodeRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
    });

    useEffect(() => {
        if (!videoNodeRef.current) return;

        playerRef.current = videojs(videoNodeRef.current, {
            autoplay: true,
            muted: true,
            controls: false,
            preload: "auto",
            loop: true, // ✅ native smooth loop
            fluid: true,
            sources: [
                {
                    src: "/postervideo.mp4",
                    type: "video/mp4",
                },
            ],
        });

        // Loader when video is ready
        playerRef.current.on("canplay", () => setLoading(false));

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    // Countdown Timer
    useEffect(() => {
        const launchDate = new Date("2025-12-28T00:00:00").getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            if (distance <= 0) {
                clearInterval(interval);
                setTimeLeft({
                    days: "00",
                    hours: "00",
                    minutes: "00",
                    seconds: "00",
                });
                return;
            }

            const days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0");
            const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0");
            const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
            const seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, "0");

            setTimeLeft({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col text-white font-sans w-full h-full min-h-screen relative overflow-hidden">
            {/* Background video */}
            <div className="absolute top-0 left-0 w-screen h-screen -z-10">
                <div data-vjs-player className="w-screen h-screen">
                    <video
                        ref={videoNodeRef}
                        className="video-js vjs-default-skin !w-screen !h-screen object-cover"
                        playsInline
                        muted
                        loop
                    />
                </div>
            </div>

            {/* Loader */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-50">
                    <div className="w-12 h-12 border-4 border-[#D79A2F] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Header */}
            <header className="flex bg-white/10 backdrop-blur-sm h-18 shadow-lg items-center justify-between px-4 py-3 relative z-10">
                <div className="flex cursor-pointer items-center">
                    <Image
                        src="/realbeez.png"
                        alt="logo"
                        width={180}
                        height={80}
                        priority
                    />
                </div>
                <div className="flex gap-3 justify-between items-center text-gray-800">
                    <Link className="hover:underline hover:text-blue-800" href="/about"> About Us</Link>
                    <Link className="hover:underline hover:text-blue-800" href="/contact"> Contact Us</Link>
                </div>
            </header>

            {/* Main content with gradient overlay */}
            <main className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 text-center px-4">
                {!loading && <div className="bg-gradient-to-r from-black/70 via-black/50 to-transparent p-6 rounded-2xl shadow-lg">
                    {/* Coming Soon text */}
                    <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                        Coming Soon
                    </p>
                    {/* Timer */}
                    <div className="mt-6 flex gap-6 text-center bg-white/70 rounded-lg px-4 py-2 text-xl font-bold">
                        <div className="text-[#D79A2F]">
                            <div className="text-2xl">{timeLeft.days}</div>
                            <div className="text-sm">Days</div>
                        </div>
                        <div className="text-[#3D3D3D]">
                            <div className="text-2xl">{timeLeft.hours}</div>
                            <div className="text-sm">Hours</div>
                        </div>
                        <div className="text-[#3D3D3D]">
                            <div className="text-2xl">{timeLeft.minutes}</div>
                            <div className="text-sm">Minutes</div>
                        </div>
                        <div className="text-[#D79A2F]">
                            <div className="text-2xl">{timeLeft.seconds}</div>
                            <div className="text-sm">Seconds</div>
                        </div>
                    </div>
                </div>}
            </main>

            {/* Footer */}
            <footer className="p-3 text-sm text-gray-200 bg-black/10 backdrop-blur-sm relative z-10">
                <div className="w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
                    <span>© {new Date().getFullYear()} Real Beez Estates Pvt Ltd</span>
                    <div className="flex gap-3">
                        <Link className="hover:underline" href="/policy">Privacy</Link>
                        <Link className="hover:underline" href="/terms">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
