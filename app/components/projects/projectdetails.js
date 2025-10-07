"use client";
import { useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ProjectDetailsPage({ project }) {
    const [expandedSections, setExpandedSections] = useState({
        address: false,
        amenities: false,
        other: false,
    });

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Reusable collapsible section
    const Section = ({ title, isOpen, toggle, children }) => (
        <div>
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={toggle}
            >
                <h3 className="font-semibold">{title}</h3>
                <span className="w-5 h-5">
                    {isOpen ? <MinusIcon /> : <PlusIcon />}
                </span>
            </div>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-screen mt-2" : "max-h-0"
                    }`}
            >
                {children}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-5 p-10">
            {/* Left: Images */}
            <div className="flex flex-col gap-3 w-full md:w-1/2">
                {project.images.map((item, index) => (
                    <div
                        key={index}
                        className="w-full h-64 md:h-80 rounded-lg overflow-hidden"
                    >
                        <img
                            src={item?.image || item?.url}
                            alt={`Project Image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                ))}
            </div>

            {/* Right: Collapsible Details */}
            <div className="w-full md:w-1/2 p-4 rounded text-gray-800 space-y-4">
                <h2 className="text-xl font-bold">{project.title}</h2>

                <Section
                    title="Address"
                    isOpen={expandedSections.address}
                    toggle={() => toggleSection("address")}
                >
                    <p className="text-gray-700">
                        {`${project.address.locality}, ${project.address.area}, ${project.address.city}, ${project.address.state}, ${project.address.country}`}
                    </p>
                </Section>

                <Section
                    title="Amenities"
                    isOpen={expandedSections.amenities}
                    toggle={() => toggleSection("amenities")}
                >
                    <ul className="list-disc list-inside text-gray-700">
                        {project.amenities.map((amenity, i) => (
                            <li key={i}>{amenity}</li>
                        ))}
                    </ul>
                </Section>

                <Section
                    title="Other Details"
                    isOpen={expandedSections.other}
                    toggle={() => toggleSection("other")}
                >
                    <ul className="text-gray-700 space-y-1">
                        <li><strong>Type:</strong> {project.type}</li>
                        <li><strong>Status:</strong> {project.status}</li>
                        <li><strong>Price:</strong> {project.price} {project.currency}</li>
                        <li><strong>Area:</strong> {project.area_sq_ft} sq.ft</li>
                        <li><strong>Bedrooms:</strong> {project.bedrooms}</li>
                        <li><strong>Bathrooms:</strong> {project.bathrooms}</li>
                        <li><strong>Furnishing:</strong> {project.furnishing}</li>
                        <li><strong>RERA No:</strong> {project.rera_no}</li>
                        <li><strong>Block:</strong> {project.block}, <strong>Floor:</strong> {project.floor_no}, <strong>Flat No:</strong> {project.flat_no}</li>
                    </ul>

                    {project.videos?.length > 0 && (
                        <div className="mt-2">
                            <strong>Videos:</strong>
                            <ul className="mt-1 space-y-1">
                                {project.videos.map((video, i) => (
                                    <li key={i}>
                                        <Link
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline"
                                        >
                                            {video.direction} video
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Section>
            </div>
        </div>
    );
}
