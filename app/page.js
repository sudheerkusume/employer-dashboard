'use client'
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Clock from "./comaonents/clock";

export default function ComingSoon() {
  const playerRef = useRef(null);
  const videoNodeRef = useRef(null);

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
      loop: true,
      muted: true,
      controls: false,
      preload: "auto",
      sources: [
        {
          src: "/postervideo.mp4",
          type: "video/mp4",
        },
      ],
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

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
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div data-vjs-player className="w-full h-full">
          <video
            ref={videoNodeRef}
            className="video-js vjs-default-skin w-full h-full object-contain"
          ></video>
        </div>
      </div>

      {/* Header */}
      <header className="flex bg-white/50 h-18 shadow-lg items-center justify-between px-4 py-3 relative z-10">
        <div className="flex items-center">
          <Image
            src="/realbeez.png"
            alt="logo"
            width={180}
            height={80}
            priority
          />
        </div>
        <div>
          <span className="text-xl text-gray-800 hidden md:inline">
            Real Beez Estates Pvt Ltd
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 text-center">
        {/* Coming Soon text */}
        <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          Coming Soon
        </p>

        {/* Timer + Clock side by side */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Countdown Timer */}
          <div className="flex gap-6 text-center bg-white/70 rounded-lg px-6 py-4 text-2xl font-bold">
            <div className="text-[#D79A2F]">
              <div className="text-4xl">{timeLeft.days}</div>
              <div className="text-sm">Days</div>
            </div>
            <div className="text-[#3D3D3D]">
              <div className="text-4xl">{timeLeft.hours}</div>
              <div className="text-sm">Hours</div>
            </div>
            <div className="text-[#3D3D3D]">
              <div className="text-4xl">{timeLeft.minutes}</div>
              <div className="text-sm">Minutes</div>
            </div>
            <div className="text-[#D79A2F]">
              <div className="text-4xl">{timeLeft.seconds}</div>
              <div className="text-sm">Seconds</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-sm text-gray-900 bg-white/40 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <span>© {new Date().getFullYear()} Real Beez Estates Pvt Ltd</span>
          <div className="flex gap-3">
            <Link className="hover:underline" href="#">Privacy</Link>
            <Link className="hover:underline" href="#">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
