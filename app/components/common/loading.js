'use client';
import React, { useEffect, useState } from "react";

const Loading = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevents SSR mismatch

  return (
    <div className="fixed top-[15%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <span className="inline-flex items-center justify-center w-10 h-10 bg-red-500 border-4 border-red-700 rounded-full opacity-75 animate-ping"></span>
    </div>
  );
};

export default Loading;
