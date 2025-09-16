"use client";
import { Book, BookOpen } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function TermsPage() {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="w-full bg-white text-gray-800">
            <div className="w-full sm:w-[60%] mx-auto py-20">
                <nav className="text-sm mb-6">
                    <p className="cursor-pointer">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Home
                        </Link>{" "}
                        &gt; <span className="text-gray-600">Terms & Conditions</span>
                    </p>
                </nav>
                <div
                    className="bg-yellow-50 rounded-lg h-48 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {hovered ? (
                        <BookOpen className="w-10 h-10 mb-2 text-[#D79A2F] transition-transform duration-500 transform scale-110 rotate-3" />
                    ) : (
                        <Book className="w-10 h-10 mb-2 text-[#D79A2F] transition-transform duration-500" />
                    )}

                    <h1 className="text-3xl font-bold text-[#3D3D3D]">Terms & Conditions</h1>
                </div>
                <div className="space-y-6">
                    <div className="pt-10">
                        <h2 className="text-xl font-semibold">Services</h2>
                        <p>
                            Real Beez Estates Pvt Ltd provides property consultation, brokerage,
                            and related services. We do not guarantee property appreciation,
                            returns, or third-party obligations.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">User Responsibilities</h2>
                        <ul className="list-disc list-inside">
                            <li>Provide accurate and true information when engaging with us.</li>
                            <li>Not misuse our services for fraudulent or illegal purposes.</li>
                            <li>Comply with applicable real estate and property laws.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">3. Property Listings & Information</h2>
                        <p>
                            Property details are provided as received from developers/owners and
                            may be subject to change. We are not liable for inaccuracies, delays,
                            or changes in project details made by third parties.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Fees & Payments</h2>
                        <p>
                            Brokerage or service charges, if applicable, will be communicated
                            transparently. All payments must comply with applicable laws
                            (RERA, GST, etc.).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
                        <p>
                            We are not responsible for disputes between buyers and sellers.
                            We shall not be held liable for any indirect, incidental, or
                            financial losses resulting from the use of our services.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Intellectual Property</h2>
                        <p>
                            All logos, content, designs, and material on our website are the
                            property of Real Beez Estates Pvt Ltd. Unauthorized use is prohibited.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Third-Party Links</h2>
                        <p>
                            Our website may contain links to third-party websites.
                            We are not responsible for their content, privacy, or terms.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of India. Disputes shall be
                            subject to the jurisdiction of courts in Hyderabad, Telangana.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Termination of Services</h2>
                        <p>
                            We reserve the right to suspend or terminate access to our services
                            in case of misuse or violation of these Terms.
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
