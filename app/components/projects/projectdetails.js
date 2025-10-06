"use client";
import Slider from "../common/slider";
import { createRef, useEffect, useRef, useState } from "react";

export default function ProjectDetailsPage({ project }) {
    const [activeTab, setActiveTab] = useState("About");

    const sections = [
        "About",
        "Plans",
        "Amenities",
        "Specifications",
        "Location",
        "Gallery",
        "Walkthrough Video",
    ];

    // Refs for scrolling
    const sectionRefs = useRef({});
    sections.forEach((sec) => {
        sectionRefs.current[sec] = sectionRefs.current[sec] || createRef();
    });

    // Track active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveTab(entry.target.dataset.section);
                    }
                });
            },
            { threshold: 0.6 }
        );

        sections.forEach((sec) => {
            if (sectionRefs.current[sec]?.current) {
                observer.observe(sectionRefs.current[sec].current);
            }
        });

        return () => {
            sections.forEach((sec) => {
                if (sectionRefs.current[sec]?.current) {
                    observer.unobserve(sectionRefs.current[sec].current);
                }
            });
        };
    }, []);

    // Scroll on tab click
    const handleTabClick = (sec) => {
        sectionRefs.current[sec]?.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <div className="mt-20">
            <div className="w-full sm:w-[80%] mx-auto">
                {/* Project Slider */}
                <Slider data={project?.images || []} imageSize={"400px"} />
                {/* Tabs */}
                <div className="flex flex-wrap gap-4 justify-center mt-8 sticky top-0 bg-white py-3 z-10 border-b">
                    {sections.map((sec) => (
                        <button
                            key={sec}
                            onClick={() => handleTabClick(sec)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${activeTab === sec
                                ? "bg-yellow-600 text-white border-yellow-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                        >
                            {sec}
                        </button>
                    ))}
                </div>

                {/* Section Content */}
                <div className="space-y-20 mt-10">
                    {/* ABOUT */}
                    <div
                        ref={sectionRefs.current["About"]}
                        data-section="About"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">About</h2>
                        <p className="text-gray-700 mb-3">
                            <strong>{project.title}</strong> is a premium{" "}
                            {project.projectType?.toLowerCase()} project located at{" "}
                            <strong>{project.location}</strong>.
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Status: {project.status}</li>
                            <li>Price: {project.price}</li>
                            <li>Configuration: {project.bedrooms}</li>
                            <li>Development Size: {project.devSize}</li>
                            <li>Total Units: {project.totalUnits}</li>
                        </ul>
                    </div>

                    {/* PLANS */}
                    <div
                        ref={sectionRefs.current["Plans"]}
                        data-section="Plans"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Plans</h2>
                        <p className="text-gray-600">Floor plans and layouts go here.</p>
                    </div>

                    {/* AMENITIES */}
                    <div
                        ref={sectionRefs.current["Amenities"]}
                        data-section="Amenities"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                        <p className="text-gray-600">Amenities list goes here.</p>
                    </div>

                    {/* SPECIFICATIONS */}
                    <div
                        ref={sectionRefs.current["Specifications"]}
                        data-section="Specifications"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Specifications</h2>
                        <p className="text-gray-600">Project specifications go here.</p>
                    </div>

                    {/* LOCATION */}
                    <div
                        ref={sectionRefs.current["Location"]}
                        data-section="Location"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Location</h2>
                        <p className="text-gray-600">
                            Located at {project.location}, well connected to major hubs.
                        </p>
                    </div>

                    {/* GALLERY */}
                    <div
                        ref={sectionRefs.current["Gallery"]}
                        data-section="Gallery"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
                        <p className="text-gray-600">Image gallery goes here.</p>
                    </div>

                    {/* WALKTHROUGH VIDEO */}
                    <div
                        ref={sectionRefs.current["Walkthrough Video"]}
                        data-section="Walkthrough Video"
                        className="scroll-mt-24"
                    >
                        <h2 className="text-2xl font-semibold mb-4">Walkthrough Video</h2>
                        <p className="text-gray-600">Video embed goes here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
