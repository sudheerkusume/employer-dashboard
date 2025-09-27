// components/Footer.js or components/Footer.tsx

import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from 'lucide-react';
import React from 'react';

const Footer = () => {
    return (
        <footer className="relative w-full text-white overflow-hidden">
            {/* Background Image/Overlay Container - Replace 'bg-green-900' with your actual image and overlay styling */}
            <div
                className="relative bg-cover bg-center"
                style={{
                    backgroundImage: "url('/path-to-your-background-image.jpg')",
                    // Adding a dark, greenish overlay for the mood and readability
                    filter: 'brightness(0.7) grayscale(0.2)'
                }}
            >
                {/* Dark Overlay (Optional, for better text readability) 
        <div className="absolute inset-0 bg-black opacity-30"></div> 
        */}

                <div className="container mx-auto px-4 py-10 md:py-16 lg:py-20 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start">

                        {/* Left Section: Logo, Address, Contact */}
                        <div className="w-full lg:w-2/5 mb-8 lg:mb-0">
                            {/* Logo Area */}
                            <div className="flex items-center mb-6">
                                {/* Replace with your actual Logo component or Image */}
                                <div className="text-4xl font-bold font-serif">
                                    <span className="text-white">Real</span><span className="text-yellow-400">Beez</span>
                                    {/*  (Optional image tag) */}
                                </div>
                            </div>

                            {/* Address and Contact */}
                            <div className="space-y-2 text-sm max-w-xs leading-relaxed" style={{ color: '#E0E0E0' }}>
                                <p>
                                    2nd Floor, YS RAO Towers, Madhapur Rd,
                                </p>
                                <p>
                                    Sri Rama Colony, Jubilee Hills,
                                </p>
                                <p className="mb-4">
                                    Hyderabad, Telangana 500033
                                </p>
                                <p className="pt-2 font-medium">+91-8121986767</p>
                                <p className="text-yellow-500 font-medium">Info@Real-Beez.com</p>
                            </div>

                            {/* Social Icons */}
                            <div className="flex space-x-4 mt-6">
                                <a href="#" className="p-2 border border-white hover:border-yellow-500 rounded-full transition duration-300">
                                    <FacebookIcon className="w-4 h-4" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-yellow-500 rounded-full transition duration-300">
                                    <InstagramIcon className="w-4 h-4" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-yellow-500 rounded-full transition duration-300">
                                    <LinkedinIcon className="w-4 h-4" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-yellow-500 rounded-full transition duration-300">
                                    <TwitterIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Right Section: Subscription Form & House Image */}
                        <div className="w-full lg:w-3/5 flex justify-end">

                            {/* House/Property Image Container - This will be complex to replicate perfectly with simple CSS */}
                            {/* The image shows a partial view of a modern house on the right, which acts as part of the background/design. */}
                            {/* For simplicity, we'll position the form over the general area where the house is shown. */}
                            <div className="relative w-full max-w-lg p-6 lg:p-0">

                                {/* House Placeholder - Use the actual image you have and position it carefully. 
                <img 
                  src="/path-to-your-house-image.png" 
                  alt="Modern House" 
                  className="absolute bottom-0 right-0 w-full h-auto object-cover" 
                />
                */}

                                {/* The main form overlay for the Enquiry */}
                                <form className="relative mt-8 lg:mt-0 lg:ml-auto max-w-sm">
                                    <p className="text-lg mb-3 tracking-wider font-light">Enter Your Email Address</p>

                                    {/* Email Input */}
                                    <input
                                        type="email"
                                        placeholder="Your Email For Updates"
                                        className="w-full p-4 mb-4 text-black placeholder-gray-600 bg-white border border-gray-300 rounded-none shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        style={{
                                            // Custom styles to match the input box's subtle off-white/beige color
                                            backgroundColor: '#F7F7F0',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition duration-300 shadow-lg rounded-none"
                                        style={{
                                            // Custom styles to match the warm, slightly darker orange/gold button
                                            backgroundColor: '#D99849',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                                        }}
                                    >
                                        Submit Your Enquiry Now
                                    </button>
                                </form>

                            </div>
                        </div>

                    </div>

                    {/* Divider Line */}
                    <hr className="my-8 border-gray-600" />

                    {/* Bottom Bar: Copyright and Links */}
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs font-light" style={{ color: '#A0A0A0' }}>
                        <p>© All Right Reserved 2025</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-yellow-500 transition duration-200">Terms Of Use</a>
                            <a href="#" className="hover:text-yellow-500 transition duration-200">Privacy Policy</a>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;