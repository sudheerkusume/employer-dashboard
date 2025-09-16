"use client";
import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000); // hide after 3s
    };

    const onSendMessage = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast("error", "Name is required");
            return;
        }
        if (!formData.email.trim()) {
            showToast("error", "Email is required");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast("error", "Please enter a valid email");
            return;
        }
        if (!formData.message.trim()) {
            showToast("error", "Message is required");
            return;
        }

        // Success
        showToast("success", "We received your details, we will get in touch with you!");

        // Reset form
        setFormData({
            name: "",
            email: "",
            message: "",
        });
    };

    // Check if form is valid for enabling the button
    const isFormValid = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return (
            formData.name.trim() &&
            emailRegex.test(formData.email) &&
            formData.message.trim()
        );
    };

    return (
        <div className="w-full bg-white text-gray-800 relative">
            {/* Toast */}
            {toast && (
                <div
                    tabIndex={0} // makes it focusable
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                px-6 py-3 rounded-lg shadow-lg text-gray-800 text-center 
                transition focus:outline-none focus:ring-2 focus:ring-yellow-400
                ${toast.type === "success" ? "bg-green-100" : "bg-red-100"}`}
                >
                    {toast.message}
                </div>
            )}

            <div className="w-full sm:w-[60%] mx-auto py-20">
                <nav className="text-sm mb-6">
                    <p className="cursor-pointer">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Home
                        </Link>{" "}
                        &gt; <span className="text-gray-600">Contact Us</span>
                    </p>
                </nav>

                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg h-40 flex flex-col items-center justify-center mb-10 shadow-lg">
                    <h1 className="text-3xl font-bold text-white">Contact Us</h1>
                    <p className="text-white text-sm mt-2">We’d love to hear from you</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Send us a Message</h2>
                        <form className="space-y-4" onSubmit={onSendMessage}>
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Your name"
                                    className="w-full px-3 py-2 border focus:border-yellow-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2 border focus:border-yellow-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Message</label>
                                <textarea
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    placeholder="Write your message..."
                                    className="w-full px-3 py-2 border focus:border-yellow-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!isFormValid()}
                                className={`px-4 py-2 rounded-lg shadow-md transition text-white 
                                    ${isFormValid()
                                        ? "bg-yellow-500 cursor-pointer hover:bg-yellow-600"
                                        : "bg-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-yellow-50 rounded-lg shadow-md p-6 flex flex-col justify-center">
                        <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                        <div className="space-y-3">
                            <p className="flex items-center space-x-2">
                                <Mail className="w-5 h-5 text-yellow-600" />
                                <a
                                    href="mailto:developer@real-beez.com"
                                    className="text-blue-600 hover:underline"
                                >
                                    developer@real-beez.com
                                </a>
                            </p>
                            <p className="flex items-center space-x-2">
                                <Phone className="w-5 h-5 text-yellow-600" />
                                <span>+91 98765 43210</span>
                            </p>
                            <p className="flex items-start space-x-2">
                                <MapPin className="w-5 h-5 text-yellow-600 mt-1" />
                                <span>
                                    Real Beez Estates Pvt Ltd, <br />
                                    2nd Floor, YS RAO Towers, Madhapur Rd, <br />
                                    Sri Rama Colony, Jubilee Hills, Hyderabad, Telangana 500033
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
