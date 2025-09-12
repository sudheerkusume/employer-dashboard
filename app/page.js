'use client'
import React, { useState } from 'react';

// Main App component which contains all the UI and logic for the coming soon page.
export default function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Handle form submission. In a real app, this would send the email to a backend.
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log(`Email submitted: ${email}`);
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen text-white font-sans">
      {/* Header/Nav Bar */}
      <header className="p-4 flex justify-between items-center bg-gray-700 z-10">
        {/* Logo Section - Left side */}
        <div className="flex items-center space-x-2">
          {/* House Icon SVG for the logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-yellow-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Real Beez Estates Pvt Ltd
          </span>
        </div>

        {/* Login/User Icon - Right side */}
        <button
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="User account"
        >
          {/* User Icon SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.93 0 3.5 1.57 3.5 3.5S13.93 12 12 12s-3.5-1.57-3.5-3.5S10.07 5 12 5zm0 14.2c-2.67 0-5.33-1.33-8-4a9.97 9.97 0 0 1 16 0c-2.67 2.67-5.33 4-8 4z" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center text-center p-4 md:p-8 relative">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-30 z-0"></div>

        {/* Thematic background image using an SVG pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] z-0 pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative z-10 w-full mx-auto backdrop-blur-sm p-6 sm:p-10 rounded-3xl border border-white/[0.1] bg-white/[0.05] shadow-lg">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600 mb-4 animate-pulse">
            We're building something beautiful.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            A new way to find your dream property is coming soon. Stay tuned for
            our launch! We are curating the finest selection of homes, commercial spaces, and investment opportunities.
          </p>

          {/* Email Subscription Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {submitted ? (
              <div className="text-green-400 text-lg md:text-xl font-medium p-4 rounded-xl border border-green-400 bg-green-900/[0.2]">
                Thank you for subscribing! We'll be in touch.
              </div>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full sm:w-80 p-2 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto p-2 rounded-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors shadow-lg transform hover:scale-105"
                >
                  Notify Me
                </button>
              </>
            )}
          </form>
        </div>
      </main>

      {/* Footer with social links */}
      <footer className="p-4 text-center text-gray-400 text-sm">
        <p className="mb-4 md:mb-0">&copy; 2025 Real Beez Estates Pvt Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
