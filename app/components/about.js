"use client";
import React from "react";
import { Building2, Target, Home, Users, Globe2, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="w-full bg-white text-gray-800">
            <div className="w-full sm:w-[60%] mx-auto py-20">
                {/* Breadcrumb */}
                <nav className="text-sm mb-6">
                    <p className="cursor-pointer">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Home
                        </Link>{" "}
                        &gt; <span className="text-gray-600">About Us</span>
                    </p>
                </nav>

                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg h-40 flex flex-col items-center justify-center mb-10 shadow-lg">
                    <h1 className="text-3xl font-bold text-white">About Us</h1>
                    <p className="text-white text-sm mt-2 max-w-lg text-center">
                        Building trust and shaping skylines with{" "}
                        <span className="font-semibold">Real Beez Estates Pvt Ltd</span>
                    </p>
                </div>

                {/* Who We Are */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Users className="w-6 h-6 text-yellow-600" /> Who We Are
                    </h2>
                    <p className="leading-relaxed">
                        Real Beez Estates Pvt Ltd is a forward-looking real estate consultancy
                        and PropTech company headquartered in Hyderabad. We provide
                        end-to-end property solutions — from residential and commercial
                        projects to legal, financial, and digital services. With innovation at
                        the core, we are transforming how people buy, sell, and experience
                        real estate across India.
                    </p>
                </section>

                {/* Our Mission */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Target className="w-6 h-6 text-yellow-600" /> Our Mission
                    </h2>
                    <p className="leading-relaxed">
                        Our mission is to simplify real estate transactions and empower
                        homebuyers, investors, and businesses with technology-driven,
                        transparent, and reliable property solutions. Guided by RERA
                        compliance and ethical practices, we aim to build lasting trust while
                        delivering world-class services.
                    </p>
                </section>

                {/* Vision 2030 */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-600" /> Our Vision 2030
                    </h2>
                    <p className="leading-relaxed">
                        To become the world’s #1 PropTech + LegalTech + Media platform by
                        2030, redefining global real estate with innovation in AI/ML,
                        blockchain, AR/VR, and smart city integrations.
                    </p>
                </section>

                {/* Our Projects */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Building2 className="w-6 h-6 text-yellow-600" /> Our Projects
                    </h2>
                    <p className="leading-relaxed">
                        From luxury residences in Jubilee Hills to affordable housing across
                        Hyderabad, we have contributed to landmark developments that
                        redefine urban living. Partnering with reputed builders, developers,
                        and financial institutions, our projects blend quality, innovation,
                        and sustainability.
                    </p>
                </section>

                {/* Why Choose Us */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Home className="w-6 h-6 text-yellow-600" /> Why Choose Us
                    </h2>
                    <ul className="list-disc list-inside leading-relaxed space-y-2">
                        <li>Trusted by 5000+ happy families, investors, and corporates.</li>
                        <li>Verified properties with transparent, RERA-compliant processes.</li>
                        <li>Strong ecosystem of builders, banks, and legal experts.</li>
                        <li>End-to-end support — from site visits to registration & beyond.</li>
                        <li>Technology-first approach with AI/ML and digital tools.</li>
                    </ul>
                </section>

                {/* Global Roadmap */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                        <Globe2 className="w-6 h-6 text-yellow-600" /> Our Roadmap
                    </h2>
                    <p className="leading-relaxed">
                        Real Beez is scaling beyond boundaries with a clear 5-year growth
                        strategy — from foundation and nationwide expansion to innovation in
                        AR/VR, blockchain, and global outreach. By 2025, we envision entering
                        international markets, forming government & smart city partnerships,
                        and preparing for IPO to cement our place as a global PropTech leader.
                    </p>
                </section>
            </div>
        </div>
    );
}
