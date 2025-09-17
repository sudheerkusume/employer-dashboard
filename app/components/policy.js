"use client";
import { Lock, Unlock } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function PolicyPage() {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="w-full bg-white text-gray-800">
            <div className="w-full sm:w-[60%] mx-auto py-5 sm:py-20 px-4 sm:px-0">
                <nav className="text-sm mb-6">
                    <p className="cursor-pointer">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Home
                        </Link>{" "}
                        &gt; <span className="text-gray-600">Privacy Policy</span>
                    </p>
                </nav>
                <div
                    className="bg-yellow-200 rounded-lg h-48 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {hovered ? (
                        <Unlock className="w-10 h-10 mb-2 text-[#D79A2F] transition-transform duration-300 transform rotate-12" />
                    ) : (
                        <Lock className="w-10 h-10 mb-2 text-[#D79A2F] transition-transform duration-300" />
                    )}

                    <h1 className="text-3xl font-bold text-[#3D3D3D]">Privacy Policy</h1>
                </div>
                <div className="space-y-6">
                    <div className="pt-10">
                        <h2 className="text-xl font-semibold">Information We Collect</h2>
                        <ul className="list-disc list-inside">
                            <li>Personal details: name, email, phone, address, identification details.</li>
                            <li>Property preferences: location, budget, type of property (buy, rent, commercial, residential).</li>
                            <li>Usage data: browsing history, searches, chat interactions with agents/owners.</li>
                            <li>Financial/transaction data (only when required for booking, token payments, etc.).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">How We Use Your Information</h2>
                        <ul className="list-disc list-inside">
                            <li>To suggest relevant properties and services.</li>
                            <li>To connect you with property owners, tenants, developers, or verified agents.</li>
                            <li>To send property alerts, newsletters, and promotional offers (with your consent).</li>
                            <li>For legal compliance (RERA, KYC verification, taxation).</li>
                            <li>For fraud detection and improving platform experience.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Sharing of Information</h2>
                        <p>
                            We may share your information with property owners, developers, builders, or verified agents
                            to facilitate property transactions. Additionally, we may share with trusted service providers
                            (advertising, payment gateways, analytics) as per industry practices.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Communication & Consent</h2>
                        <p>
                            By using our services, you consent to receive communication via SMS, WhatsApp, email, or phone
                            regarding property updates, offers, and services. You may opt out anytime.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Data Security</h2>
                        <p>
                            We use industry-standard security practices, but no method of transmission is 100% secure.
                            Users are advised to verify details independently before entering into any property transaction.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Cookies & Tracking</h2>
                        <p>
                            We use cookies and analytics tools (such as Google Analytics, Facebook Pixel)
                            to improve user experience and serve relevant ads.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Updates</h2>
                        <p>
                            This policy may be updated periodically. The latest version will always be available on our website.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Contact Us</h2>
                        <p>
                            Email:{" "}
                            <Link
                                href="mailto:developer@real-beez.com"
                                className="text-blue-600 hover:underline"
                            >
                                developer@real-beez.com
                            </Link>
                        </p>
                        <p>
                            Address: Real Beez Estates Pvt Ltd,
                            2nd Floor, YS RAO Towers, Madhapur Rd, Sri Rama Colony, Jubilee Hills, Hyderabad, Telangana 500033
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
