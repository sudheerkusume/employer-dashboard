'use client'
import { useRouter } from "next/navigation";

const Requestage = () => {
    const router = useRouter()
    return (
        <div className="w-full sm:w-[60%] mx-auto bg-gray-300 p-2 rounded-md">
            <div className="flex gap-1 sm:justify-between">
                <div className="cursor-pointer col-span-2 flex text-center flex-col justify-center items-center p-3 bg-gray-600 rounded-sm shadow-md">
                    <button className="text-white cursor-pointer font-bold text-md">DOWNLOAD BROCHURE</button>
                </div>
                <div onClick={() => router.push("/requestform")} className="cursor-pointer col-span-2 flex text-center flex-col justify-center items-center p-3 bg-gray-600 rounded-sm shadow-md">
                    <button className="text-white cursor-pointer font-bold text-md">REQUEST QUOTE</button>
                    <p className="text-xs text-gray-100 mt-1">
                        it takes 24-48 hours to get the real-time quote
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Requestage;
