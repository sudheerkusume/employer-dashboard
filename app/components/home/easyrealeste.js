import React from 'react';
import Image from 'next/image';
const estateImage = '/images/luxuryvilla.png';

const EasyRealEstateSection = () => {
    return (
        <div className="p-4 md:p-10 lg:p-16 bg-white max-w-7xl mx-auto my-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">

                <div className="lg:w-1/2 flex flex-col justify-center">

                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-800">
                        Easy Real Estate
                    </h1>

                    <p className="text-3xl sm:text-4xl font-semibold mb-6 text-gray-800">
                        Buy, <span className="text-amber-500">Sell</span>, Rent
                    </p>

                    <p className="mb-4 text-gray-600 leading-relaxed">
                        Whether you're ready to buy your first home, **sell** your current property,
                        invest in real estate, or just need guidance on where to start — we're
                        here for you.
                    </p>

                    <p className="mb-8 text-gray-600 leading-relaxed">
                        Our dedicated team brings deep local knowledge, industry expertise,
                        and a commitment to personalized service that puts your goals first.
                        We understand that real estate decisions are some of the most
                        important you'll make. That's why we take the time to **listen, advise, and**
                        **support** you every step of the way.
                    </p>

                    <button
                        className="flex items-center justify-center lg:justify-start w-48 py-3 px-4 text-gray-800 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: '#f2eef6' }}
                        aria-label="Explore More about Easy Real Estate services"
                    >
                        Explore More
                        <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            ></path>
                        </svg>
                    </button>
                </div>

                <div className="lg:w-1/2 relative aspect-[5/4] w-full shadow-2xl rounded-xl overflow-hidden">
                    <Image
                        src={estateImage}
                        alt="Luxurious modern home with a pool at dusk"
                        layout="fill"
                        objectFit="cover"
                        priority
                        className="transition duration-500 ease-in-out hover:scale-105" // Optional: subtle hover effect
                    />
                </div>

            </div>
        </div>
    );
};

export default EasyRealEstateSection;