'use client'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useContext } from 'react';
import RootContext from '../config/rootcontext';

const Footer = () => {
    const { rootContext, setRootContext } = useContext(RootContext);

    const submitQuery = (e) => {
        e.preventDefault()
        setRootContext({
            ...rootContext,
            toast: {
                show: true,
                dismiss: true,
                type: "info",
                title: "Your Email For Update",
                message: "We recived your Email we will inform you our feature Updates!",
            },
        });
    }
    return (
        <footer className="relative w-full text-white overflow-hidden">
            <div
                className="relative bg-cover bg-center"
                style={{
                    backgroundImage: "url('/images/footer-bg.png')",
                    filter: 'brightness(0.7) grayscale(0.2)'
                }}
            >
                <div className="container mt-5 mx-auto px-4 py-2 md:py-4 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start">
                        <div className="w-full lg:w-2/5 mb-8 lg:mb-0">
                            {/* Logo Area */}
                            <div className="flex items-center mb-6">
                                <div className="mb-8 flex items-center gap-2">
                                    <Image
                                        src="/realbeez.png"
                                        alt="Realbeez logo"
                                        width={160}
                                        height={50}
                                        priority
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-white max-w-xs leading-relaxed" style={{ color: '#E0E0E0' }}>
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
                                <a href="#" className="p-2 border border-white hover:border-[#FFC800] bg-[#FFC800] rounded-full transition duration-300">
                                    <FacebookIcon className="w-4 h-4 text-white" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-[#FFC800] bg-[#FFC800] rounded-full transition duration-300">
                                    <InstagramIcon className="w-4 h-4 text-white" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-[#FFC800] bg-[#FFC800] rounded-full transition duration-300">
                                    <LinkedinIcon className="w-4 h-4 text-white" />
                                </a>
                                <a href="#" className="p-2 border border-white hover:border-[#FFC800] bg-[#FFC800] rounded-full transition duration-300">
                                    <TwitterIcon className="w-4 h-4 text-white" />
                                </a>
                            </div>
                        </div>

                        {/* Right Section: Subscription Form & House Image */}
                        <div className="w-full lg:w-3/5 flex justify-end text-white">
                            <div className="relative w-full max-w-lg p-6 lg:p-0">
                                <form onSubmit={submitQuery} className="relative mt-8 lg:mt-0 lg:ml-auto max-w-sm">
                                    <p className="text-lg mb-3 text-white tracking-wider font-light">Enter Your Email Address</p>

                                    {/* Email Input */}
                                    <input
                                        type="email"
                                        placeholder="Your Email For Updates"
                                        className="w-full p-2 rounded-lg mb-4 text-[#FFC800] placeholder-[#FFC800] bg-white border border-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFC800]"
                                    />

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="w-full cursor-pointer py-2 px-4 font-semibold text-white rounded-lg bg-[#FFC800] hover:bg-[#FFC800] transition duration-300 shadow-lg"
                                    >
                                        Submit Your Enquiry Now
                                    </button>
                                </form>

                            </div>
                        </div>

                    </div>

                    {/* Divider Line */}
                    <hr className="my-2 border-gray-600" />

                    {/* Bottom Bar: Copyright and Links */}
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs font-light" style={{ color: '#A0A0A0' }}>
                        <p>© All Right Reserved 2025</p>
                        <div className="flex space-x-2 md:mt-0">
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