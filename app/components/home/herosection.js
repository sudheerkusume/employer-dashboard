import { BookOpenIcon, FilmIcon, CubeTransparentIcon, VideoCameraSlashIcon, PlayIcon } from '@heroicons/react/24/outline';
import Slider from '../common/slider';
import Image from 'next/image';
const dummyData = [
    { image: "/images/image1.jpg" },
    { image: "/images/image2.png" },
    { image: "/images/image3.png" },
    { image: "/images/image4.png" }
];
const HeroSection = () => (

    <div className="relative h-auto overflow-hidden bg-[#D79A2F]">
        {/* Background Image/Carousel */}
        <Slider data={dummyData} imageSize={"600px"} rounded={"rounded-lg"} />

        {/* Text Overlay */}
        <div className="absolute inset-0 p-8 flex flex-col justify-start text-white">
            <h1 className="text-4xl font-extrabold mt-6 z-10">ANKURA VILLAS</h1>
            <p className="text-md mt-2 z-10">
                GACHIBOWLI, HYDERABAD, TELANGANA - 500032
            </p>
        </div>

        {/* Sidebar Buttons (Right) */}
        <div className="absolute right-4 top-[20%] z-20 flex flex-col items-center justify-center space-y-3 text-center">

            {/* VR Image with Text Overlay */}
            <div className="relative w-24 flex items-center justify-center cursor-pointer">
                <Image
                    src="/images/vr.png"
                    alt="VR logo"
                    width={160}
                    height={40}
                    priority
                    className="object-contain h-auto sm:h-24"
                />
                <span className="absolute inset-0 flex items-center justify-center text-yellow-500 font-bold text-xl">
                    VR
                </span>
            </div>

            <button className="flex w-32 flex-col cursor-pointer items-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs">
                <BookOpenIcon className="h-6 w-6" />
                BROCHURE
            </button>
            <button className="flex w-32 flex-col cursor-pointer items-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs">
                <PlayIcon className="h-6 w-6" />
                VIDEOS
            </button>
            <button className="flex w-32 flex-col cursor-pointerv items-center border border-gray-400 bg-gray-600 opacity-50 text-white p-2 rounded-lg text-xs">
                <PlayIcon className="h-6 w-6" />
                3D PLAN
            </button>
        </div>

    </div>
);
export default HeroSection;