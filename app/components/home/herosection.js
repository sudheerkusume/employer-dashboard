import { BookOpenIcon, FilmIcon, CubeTransparentIcon, VideoCameraSlashIcon, PlayIcon } from '@heroicons/react/24/outline';
import Slider from '../common/slider';
import Image from 'next/image';
import RootContext from '../config/rootcontext';
import { useContext } from 'react';
const dummyData = [
    { image: "/images/image1.jpg" },
    { image: "/images/image2.png" },
    { image: "/images/image3.png" },
    { image: "/images/image4.png" }
];
const HeroSection = () => {
    const { rootContext } = useContext(RootContext);

    return (
        <div className="relative h-auto overflow-hidden bg-[#D79A2F]">
            {/* Background Image/Carousel */}
            <Slider data={dummyData} rounded="sm:rounded-lg" className="h-[260px] sm:h-[600px]" fitMode="cover" />

            {/* Text Overlay */}
            <div className="absolute inset-0 p-2 sm:p-8 flex flex-col justify-start text-white">
                <h1 className="text-lg sm:text-4xl font-blod sm:font-extrabold sm:mt-4 z-10 uppercase">
                    {`ANKURA ${rootContext.active}`}
                </h1>
                <p className="text-xs sm:text-md sm:mt-2 z-10">
                    GACHIBOWLI, HYDERABAD, TELANGANA - 500032
                </p>
            </div>

            {/* Sidebar Buttons (Right) */}
            <div className="absolute right-2 sm:right-4 top-0 sm:top-[20%] z-20 flex flex-col items-center justify-center space-y-1 sm:space-y-3 text-center">
                {/* VR Image with Text Overlay */}
                <div className="relative w-18 sm:w-24 flex items-center justify-center cursor-pointer">
                    <Image
                        src="/images/vr.png"
                        alt="VR logo"
                        width={160}
                        height={40}
                        priority
                        className="object-contain h-16 sm:h-24"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-yellow-500 font-semibold text-md sm:font-bold sm:text-xl">
                        VR
                    </span>
                </div>

                <button className="flex w-20 h-16 sm:w-32 sm:h-20 flex-col cursor-pointer items-center justify-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs sm:text-lg font-semibold sm:font-bold">
                    <Image
                        src="/icons/broucher.png"
                        alt="logo"
                        width={40}
                        height={20}
                        priority
                        className="object-contain h-5 sm:h-8"
                    />
                    BROCHURE
                </button>

                <button className="flex w-20 h-16 sm:w-32 sm:h-20 flex-col cursor-pointer items-center justify-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs sm:text-lg font-semibold sm:font-bold">
                    <Image
                        src="/icons/playicon.png"
                        alt="logo"
                        width={40}
                        height={20}
                        priority
                        className="object-contain h-5 sm:h-8"
                    />
                    VIDEOS
                </button>

                <button className="flex w-20 h-16 sm:w-32 sm:h-20 flex-col cursor-pointer items-center justify-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs sm:text-lg font-semibold sm:font-bold">
                    <Image
                        src="/icons/plan.png"
                        alt="logo"
                        width={40}
                        height={20}
                        priority
                        className="object-contain h-5 sm:h-8"
                    />
                    3D PLAN
                </button>
            </div>
        </div>
    );
};

export default HeroSection;