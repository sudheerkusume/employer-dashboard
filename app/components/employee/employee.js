"use client";
import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { EyeSlashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { EyeIcon, ChevronDownIcon, ArrowPathIcon, ArrowsPointingOutIcon } from "@heroicons/react/20/solid";
import AboutMe from "./about";
import Attendance from "./attendance";
import HRPolicy from "./hrpolicy";
import Payslip from "./payslip";
import ButtonTab from "../common/buttontab";
import RootContext from "../config/rootcontext";
import { Mutated } from "../config/useswrfetch";
import Loading from "../common/loading";
import { formatDateTime } from "../config/sitesettings";
import { useRouter } from "next/navigation";

const tabs = [
    { name: "About Me", component: AboutMe },
    { name: "Attendance", component: Attendance },
    { name: "HR Policy", component: HRPolicy },
    { name: "Payslips", component: Payslip },
];

/** ─── Utility: Create image element ───────────────────────── **/
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

/** ─── Utility: Convert degrees to radians ─────────────────── **/
const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

/** ─── Enhanced Crop Logic for Free Form ───────────────────── **/
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calculate bounding box of the rotated image
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to a central location
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Cropped Area
    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
    });
}

/** ─── Utility: Calculate rotated size ─────────────────────── **/
const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);

    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

export default function EmployeeProfile({ employeesData }) {
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState({});
    const [tempProfile, setTempProfile] = useState({});
    const [editingHeader, setEditingHeader] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Enhanced Crop states
    const [cropping, setCropping] = useState(false);
    const [cropImage, setCropImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [aspect, setAspect] = useState(1); // Start with square but allow free form
    const [cropShape, setCropShape] = useState("rect");
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [minZoom, setMinZoom] = useState(1);

    const [accordionOpen, setAccordionOpen] = useState(null);
    const [serviceCall, setServiceCall] = useState(false);
    const router = useRouter();
    const { rootContext, setRootContext } = useContext(RootContext);

    const user_details =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user_details") || "{}")
            : {};

    const role = user_details?.role || "";
    const employeeID = user_details.userId;
    const mutated = Mutated(employeeID ? `/api/employees?id=${employeeID}` : null);

    useEffect(() => {
        if (employeesData) {
            setProfile(employeesData);
            setTempProfile(employeesData);
        }
    }, [employeesData]);

    const ActiveComponent = tabs[activeTab].component;

    /** ─── Enhanced Image Upload + Crop ────────────────────── **/
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Please select an image smaller than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropImage(reader.result);
            setCropping(true);
            // Reset crop settings
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setFlip({ horizontal: false, vertical: false });
            setAspect(1); // Start with square
            setCropShape("rect");
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onMediaLoaded = useCallback((mediaSize) => {
        // Calculate minimum zoom to fit image properly
        const { width, height } = mediaSize;
        const minZoom = Math.max(400 / width, 400 / height);
        setMinZoom(minZoom);
        setZoom(minZoom);
    }, []);

    const handleCropSave = useCallback(async () => {
        try {
            if (!croppedAreaPixels) {
                throw new Error("No crop area selected");
            }

            const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, rotation, flip);
            const previewUrl = URL.createObjectURL(croppedBlob);
            const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });

            setPreviewImage(previewUrl);
            setTempProfile((prev) => ({ ...prev, imageFile: file }));
            setCropping(false);
            setCropImage(null);
        } catch (err) {
            console.error("Cropping failed:", err);
            alert("Failed to crop image. Please try again.");
        }
    }, [cropImage, croppedAreaPixels, rotation, flip]);

    const handleCropCancel = () => {
        setCropping(false);
        setCropImage(null);
        setPreviewImage("");
    };

    const resetCropSettings = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(minZoom);
        setRotation(0);
        setFlip({ horizontal: false, vertical: false });
    };

    const toggleAspect = (newAspect) => {
        setAspect(newAspect);
        // For free form, we set aspect to null/undefined in react-easy-crop
        if (newAspect === 0) {
            setAspect(undefined); // This enables free form cropping
            setCropShape("rect");
        } else {
            setAspect(newAspect);
            setCropShape("rect");
        }
    };

    const toggleFlip = (direction) => {
        setFlip(prev => ({
            ...prev,
            [direction]: !prev[direction]
        }));
    };

    const setFullCrop = () => {
        // Reset to show full image
        setCrop({ x: 0, y: 0 });
        setZoom(minZoom);
    };

    /** ─── Save Employee Header ───────────────────────────── **/
    const handleSaveHeader = async () => {
        setServiceCall(true);
        try {
            const formData = new FormData();
            formData.append("id", employeeID);
            formData.append("name", tempProfile.name || "");
            formData.append("panNumber", tempProfile.panNumber || "");
            formData.append("role", role);
            if (tempProfile.password) formData.append("password", tempProfile.password);
            if (tempProfile.imageFile) formData.append("image", tempProfile.imageFile);
            if (tempProfile.summary) formData.append("summary", tempProfile.summary);
            if (tempProfile.experience)
                formData.append("experience", JSON.stringify(tempProfile.experience));
            if (tempProfile.education)
                formData.append("education", JSON.stringify(tempProfile.education));
            if (tempProfile.attendance)
                formData.append("attendance", JSON.stringify(tempProfile.attendance));

            const res = await fetch(`/api/employees`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();
            setServiceCall(false);

            if (res.ok) {
                setProfile((prev) => ({ ...prev, ...data.updatedFields }));
                setTempProfile((prev) => ({ ...prev, ...data.updatedFields }));
                setEditingHeader(false);
                mutated();
            } else {
                console.error(data.error || "Update failed");
                alert(data.error || "Failed to update profile");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setServiceCall(false);
            alert("Error updating profile. Please try again.");
        }
    };

    const logOut = () => {
        localStorage.clear();
        let resp = rootContext;
        resp.authenticated = false;
        setRootContext({ ...resp });
        router.push("/");
    };

    return (
        <div className="mt-20 bg-white min-h-screen">
            {serviceCall && <Loading />}

            {/* Logout and existing profile code remains the same */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={logOut}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>

            {/* Profile Header - Same as before */}
            <div className="w-full sm:max-w-5xl border border-gray-200 bg-white rounded-t-xl mx-auto relative shadow-sm">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                    {/* Profile Image */}
                    <div>
                        <label
                            htmlFor="profileImageInput"
                            className={`${editingHeader ? "cursor-pointer" : "cursor-not-allowed"} group relative block mx-auto`}
                        >
                            <input
                                id="profileImageInput"
                                type="file"
                                accept="image/*"
                                disabled={!editingHeader}
                                className={`absolute inset-0 w-full h-full opacity-0 ${editingHeader ? "cursor-pointer" : "cursor-not-allowed"}`}
                                onChange={editingHeader ? handleImageChange : undefined}
                            />
                            <div className="relative w-32 h-auto bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                                <img
                                    src={
                                        previewImage ||
                                        tempProfile.profileImage ||
                                        profile.profileImage ||
                                        "https://placehold.co/150x150"
                                    }
                                    alt="Avatar"
                                    className="w-full h-full object-contain"
                                />
                                {editingHeader && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Change
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Profile Details */}
                    <div className="w-full flex flex-col">
                        {editingHeader ? (
                            <div className="flex flex-col gap-3 text-gray-700">
                                <input
                                    className="w-full px-2 py-1 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.name || ""}
                                    placeholder="Enter Full Name"
                                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                                />
                                <input
                                    className="w-full px-2 py-1 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.panNumber || ""}
                                    placeholder="Enter PAN Number"
                                    onChange={(e) => setTempProfile({ ...tempProfile, panNumber: e.target.value })}
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full px-2 py-1 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-yellow-500"
                                        value={tempProfile.password || ""}
                                        onChange={(e) =>
                                            setTempProfile({ ...tempProfile, password: e.target.value })
                                        }
                                    />
                                    <span
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                                    >
                                        {showPassword ? (
                                            <EyeIcon className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                        onClick={handleSaveHeader}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="px-4 py-1 border border-gray-400 rounded hover:bg-gray-100"
                                        onClick={() => {
                                            setEditingHeader(false);
                                            setPreviewImage("");
                                            setTempProfile(profile);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl sm:text-lg font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-xs text-gray-500">Pan Number: {profile.panNumber}</p>
                                <p className="text-xs text-gray-500">Email: {profile.email}</p>
                                <p className="text-xs text-gray-500">
                                    Employee Code: {profile?.employeeCode}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Designation: {profile?.designation}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Date of Joining: {formatDateTime(profile.dateOfJoining, "DD-MM-YYYY")}
                                </p>
                            </div>
                        )}
                    </div>

                    {!editingHeader && rootContext?.user?.role !== "recruiter" && (
                        <button
                            onClick={() => {
                                setEditingHeader(true);
                                setTempProfile(profile);
                                setShowPassword(false);
                            }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs - Same as before */}
            <div className="bg-white border-b border-gray-200 w-full sm:max-w-5xl mx-auto p-3 sm:px-4 sm:py-6 rounded-b-md shadow-sm">
                {rootContext?.user?.role === "recruiter" ? (
                    <AboutMe profile={profile} />
                ) : (
                    <>
                        <div className="hidden sm:block">
                            <ButtonTab tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                            <div className="py-3">
                                <ActiveComponent profile={profile} />
                            </div>
                        </div>

                        <div className="sm:hidden">
                            {tabs.map((tab, index) => {
                                const Component = tab.component;
                                const isOpen = accordionOpen === index;
                                return (
                                    <div key={tab.name} className="border-b border-gray-200">
                                        <button
                                            onClick={() => setAccordionOpen(isOpen ? null : index)}
                                            className="w-full flex justify-between items-center py-2 px-2 bg-gray-50 text-left"
                                        >
                                            <span className="font-medium text-gray-700 text-sm">
                                                {tab.name}
                                            </span>
                                            <ChevronDownIcon
                                                className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="p-2">
                                                <Component profile={profile} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Enhanced Crop Modal with Free Form Support */}
            {cropping && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Crop Profile Picture</h3>
                            <button
                                onClick={handleCropCancel}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Crop Area */}
                            <div className="flex-1 p-4 flex items-center justify-center bg-gray-900 min-h-[400px]">
                                <div className="relative w-full h-96">
                                    <Cropper
                                        image={cropImage}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={aspect} // undefined for free form
                                        cropShape={cropShape}
                                        showGrid={true}
                                        restrictPosition={false} // This allows free movement
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                        onCropComplete={onCropComplete}
                                        onMediaLoaded={onMediaLoaded}
                                        classes={{
                                            containerClassName: "!bg-gray-900",
                                            mediaClassName: "max-h-full max-w-full",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Controls Sidebar */}
                            <div className="w-full lg:w-80 border-l p-4 flex flex-col">
                                {/* Controls */}
                                <div className="space-y-4 flex-1 overflow-y-auto">
                                    {/* Aspect Ratio Selection */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Crop Style</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => toggleAspect(0)}
                                                className={`px-3 py-2 text-sm rounded ${aspect === undefined ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            >
                                                Free Form
                                            </button>
                                            <button
                                                onClick={() => toggleAspect(1)}
                                                className={`px-3 py-2 text-sm rounded ${aspect === 1 ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            >
                                                1:1
                                            </button>
                                            <button
                                                onClick={() => toggleAspect(4 / 3)}
                                                className={`px-3 py-2 text-sm rounded ${aspect === 4 / 3 ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            >
                                                4:3
                                            </button>
                                            <button
                                                onClick={() => toggleAspect(16 / 9)}
                                                className={`px-3 py-2 text-sm rounded ${aspect === 16 / 9 ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            >
                                                16:9
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Quick Actions</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={setFullCrop}
                                                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-1"
                                            >
                                                <ArrowsPointingOutIcon className="w-4 h-4" />
                                                Full Image
                                            </button>
                                            <button
                                                onClick={resetCropSettings}
                                                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-1"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                                Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slider Controls */}
                                    <div className="space-y-4">
                                        {/* Zoom Control */}
                                        <div>
                                            <label className="flex justify-between text-sm text-gray-700 mb-1">
                                                <span>Zoom</span>
                                                <span className="font-medium">{zoom.toFixed(1)}x</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={minZoom}
                                                max={3}
                                                step={0.1}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                            />
                                        </div>

                                        {/* Rotation Control */}
                                        <div>
                                            <label className="flex justify-between text-sm text-gray-700 mb-1">
                                                <span>Rotation</span>
                                                <span className="font-medium">{rotation}°</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={-180}
                                                max={180}
                                                step={1}
                                                value={rotation}
                                                onChange={(e) => setRotation(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4 pt-4 border-t">
                                    <button
                                        onClick={handleCropCancel}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCropSave}
                                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                    >
                                        Apply Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}