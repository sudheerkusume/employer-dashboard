'use client'
import Image from 'next/image';

// Main App component which contains all the UI and logic for the coming soon page.
export default function App() {
  return (
    <div className="relative w-screen h-screen">
      <Image
        src="/realbeez-banner.png"
        alt="logo"
        fill
        priority
        className="object-contain" // or "object-contain" if you don’t want cropping
      />
    </div>
  );
}
