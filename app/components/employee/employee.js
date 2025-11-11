"use client";
import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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

// Aspect ratio options
const ASPECT_RATIOS = [
    { label: "Free Form", value: 0 },
    { label: "1:1 Square", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
];

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
    const [crop, setCrop] = useState({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [aspect, setAspect] = useState(0); // 0 for free form
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const fileInputRef = useRef(null);

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

    // Generate preview when crop changes
    useEffect(() => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
            generateImagePreview(imgRef.current, previewCanvasRef.current, completedCrop);
        }
    }, [completedCrop, rotation, flip, zoom]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const ActiveComponent = tabs[activeTab].component;

    /** ─── Enhanced Image Upload + Crop ────────────────────── **/
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "warning",
                    title: "Warning",
                    message: "Please select an image smaller than 5MB",
                },
            }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropImage(reader.result);
            setCropping(true);
            // Reset crop settings to center
            setCrop({
                unit: '%',
                width: 50,
                height: 50,
                x: 25,
                y: 25
            });
            setCompletedCrop(null);
            setZoom(1);
            setRotation(0);
            setFlip({ horizontal: false, vertical: false });
            setAspect(0);
        };
        reader.readAsDataURL(file);

        // Reset file input to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const generateImagePreview = (image, canvas, crop) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const pixelRatio = window.devicePixelRatio;

        canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;

        // Apply transformations
        ctx.save();

        // Translate to center
        ctx.translate(cropWidth / 2, cropHeight / 2);

        // Apply flip
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Draw image
        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,
            -cropWidth / 2, -cropHeight / 2, cropWidth, cropHeight
        );

        ctx.restore();
    };

    const handleCropSave = async () => {
        try {
            const canvas = previewCanvasRef.current;
            if (!canvas) return;

            canvas.toBlob((blob) => {
                if (!blob) return;

                // Clean up previous preview URL if exists
                if (previewImage) {
                    URL.revokeObjectURL(previewImage);
                }

                const previewUrl = URL.createObjectURL(blob);
                const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

                setPreviewImage(previewUrl);
                setTempProfile((prev) => ({ ...prev, imageFile: file }));
                setCropping(false);
                setCropImage(null);
                setCompletedCrop(null);
            }, 'image/jpeg', 0.95);
        } catch (err) {
            console.error("Cropping failed:", err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Failed to crop image. Please try again.",
                },
            }));
        }
    };

    const handleCropCancel = () => {
        setCropping(false);
        setCropImage(null);
        setCompletedCrop(null);
    };

    const resetCropSettings = () => {
        setCrop({
            unit: '%',
            width: 50,
            height: 50,
            x: 25,
            y: 25
        });
        setZoom(1);
        setRotation(0);
        setFlip({ horizontal: false, vertical: false });
        setAspect(0);
    };

    const toggleAspect = (newAspect) => {
        setAspect(newAspect);

        if (newAspect === 0) {
            // Free form - no constraints
            return;
        }

        // Calculate new crop based on aspect ratio
        if (imgRef.current) {
            const image = imgRef.current;
            const imageAspect = image.naturalWidth / image.naturalHeight;
            let newCrop = { ...crop };

            if (newAspect > imageAspect) {
                // Crop is wider than image aspect
                newCrop.width = 100;
                newCrop.height = (100 / newAspect) * imageAspect;
                newCrop.x = 0;
                newCrop.y = (100 - newCrop.height) / 2;
            } else {
                // Crop is taller than image aspect
                newCrop.height = 100;
                newCrop.width = 100 * newAspect / imageAspect;
                newCrop.x = (100 - newCrop.width) / 2;
                newCrop.y = 0;
            }

            setCrop(newCrop);
        }
    };

    const toggleFlip = (direction) => {
        setFlip(prev => ({
            ...prev,
            [direction]: !prev[direction]
        }));
    };

    const setFullCrop = () => {
        setCrop({
            unit: '%',
            width: 100,
            height: 100,
            x: 0,
            y: 0
        });
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
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to update profile",
                    },
                }));
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setServiceCall(false);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Error updating profile. Please try again.",
                },
            }));
        }
    };

    const handleCancelEdit = () => {
        setEditingHeader(false);
        setPreviewImage("");
        setTempProfile(profile);
        setCropping(false);
        setCropImage(null);
        setCompletedCrop(null);
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

            {/* Logout */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={logOut}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>

            {/* Profile Header */}
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
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                disabled={!editingHeader}
                                className={`absolute inset-0 w-full h-full opacity-0 ${editingHeader ? "cursor-pointer" : "cursor-not-allowed"}`}
                                onChange={editingHeader ? handleImageChange : undefined}
                            />
                            <div className="relative w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
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
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Change
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Profile Details */}
                    <div className="w-full flex flex-col">
                        {editingHeader ? (
                            <div className="flex flex-col gap-1 text-gray-700">
                                <input
                                    className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.name || ""}
                                    placeholder="Enter Full Name"
                                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                                />
                                <input
                                    className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.panNumber || ""}
                                    placeholder="Enter PAN Number"
                                    onChange={(e) => setTempProfile({ ...tempProfile, panNumber: e.target.value })}
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
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
                                        className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                        onClick={handleSaveHeader}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="px-2 py-1 text-xs border border-gray-400 rounded hover:bg-gray-100"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-[13px] text-gray-500">Pan Number: {profile.panNumber}</p>
                                <p className="text-[13px] text-gray-500">Email: {profile.email}</p>
                                <p className="text-[13px] text-gray-500">
                                    Employee Code: {profile?.employeeCode}
                                </p>
                                <p className="text-[13px] text-gray-500">
                                    Designation: {profile?.designation}
                                </p>
                                <p className="text-[13px] text-gray-500">
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

            {/* Tabs */}
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

                        {/* Mobile Accordion */}
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

            {/* Enhanced Crop Modal with ReactCrop */}
            {cropping && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[95vh] overflow-y-auto scroll-y-auto flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-3 sm:p-4 border-b bg-yellow-50">
                            <h3 className="text-lg font-semibold text-yellow-900">Crop Profile Picture</h3>
                            <button
                                onClick={handleCropCancel}
                                className="text-yellow-700 hover:text-yellow-900 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Main Content - Responsive flex layout */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto scroll-y-auto">
                            {/* Crop Area - Takes priority on mobile, side-by-side on desktop */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-2 sm:p-4 border-b lg:border-b-0 lg:border-r bg-yellow-50 shrink-0">
                                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Crop Area</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-yellow-700">
                                            Drag to adjust crop area
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 p-2 sm:p-4 flex items-center justify-center bg-gray-900 min-h-[300px] sm:min-h-[400px] overflow-y-auto scroll-y-auto">
                                    <div className="relative max-w-full max-h-full">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={aspect || undefined}
                                            keepSelection={true}
                                            className="max-h-[50vh] sm:max-h-[60vh] max-w-full"
                                            ruleOfThirds
                                            style={{
                                                border: '2px solid #f59e0b',
                                            }}
                                            renderSelectionAddon={() => (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        border: '2px solid #f59e0b',
                                                        boxShadow: '0 0 0 9999em rgba(245, 158, 11, 0.3)',
                                                    }}
                                                />
                                            )}
                                        >
                                            <img
                                                ref={imgRef}
                                                src={cropImage}
                                                style={{
                                                    transform: `scale(${flip.horizontal ? -1 : 1}, ${flip.vertical ? -1 : 1}) rotate(${rotation}deg)`,
                                                    maxHeight: '50vh',
                                                    maxWidth: '100%',
                                                    height: 'auto'
                                                }}
                                                onLoad={(e) => {
                                                    const img = e.target;
                                                    setImageDimensions({
                                                        width: img.naturalWidth,
                                                        height: img.naturalHeight
                                                    });
                                                    setCompletedCrop(crop);
                                                }}
                                                alt="Crop preview"
                                            />
                                        </ReactCrop>
                                    </div>
                                </div>
                            </div>

                            {/* Preview and Controls */}
                            <div className="w-full lg:w-80 xl:w-96 flex flex-col border-t lg:border-t-0 lg:border-l bg-yellow-50">
                                {/* Preview Section */}
                                <div className="p-3 sm:p-4 border-b bg-yellow-100">
                                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Preview</h4>
                                    <div className="bg-white rounded-lg p-3 flex justify-center items-center border border-yellow-300">
                                        <canvas
                                            ref={previewCanvasRef}
                                            className="max-w-full max-h-24 sm:max-h-32 object-contain rounded"
                                        />
                                    </div>
                                </div>

                                {/* Controls Section - Scrollable on small screens */}
                                <div className="flex-1 overflow-y-auto scroll-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
                                    {/* Aspect Ratio Selection */}
                                    <div>
                                        <label className="text-sm font-medium text-yellow-900 mb-2 block">
                                            Aspect Ratio
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                            {ASPECT_RATIOS.map((ratio) => (
                                                <button
                                                    key={ratio.value}
                                                    onClick={() => toggleAspect(ratio.value)}
                                                    className={`px-2 py-2 text-xs sm:text-sm rounded transition-colors ${aspect === ratio.value
                                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                        : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                                                        }`}
                                                >
                                                    {ratio.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div>
                                        <label className="text-sm font-medium text-yellow-900 mb-2 block">
                                            Quick Actions
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={setFullCrop}
                                                className="px-2 py-2 text-xs sm:text-sm bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowsPointingOutIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span>Full Image</span>
                                            </button>
                                            <button
                                                onClick={resetCropSettings}
                                                className="px-2 py-2 text-xs sm:text-sm bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span>Reset All</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Transform Controls */}
                                    <div className="space-y-3 sm:space-y-4">
                                        {/* Rotation Slider */}
                                        <div>
                                            <label className="flex justify-between text-sm text-yellow-900 mb-1">
                                                <span className="font-medium">Rotation</span>
                                                <span className="text-yellow-700">{rotation}°</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setRotation(prev => Math.max(-180, prev - 5))}
                                                    className="w-8 h-8 flex items-center justify-center bg-yellow-200 rounded hover:bg-yellow-300 transition-colors text-yellow-900"
                                                >
                                                    <span className="text-sm font-bold">-</span>
                                                </button>
                                                <input
                                                    type="range"
                                                    min={-180}
                                                    max={180}
                                                    step={1}
                                                    value={rotation}
                                                    onChange={(e) => setRotation(Number(e.target.value))}
                                                    className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider-thumb-yellow"
                                                />
                                                <button
                                                    onClick={() => setRotation(prev => Math.min(180, prev + 5))}
                                                    className="w-8 h-8 flex items-center justify-center bg-yellow-200 rounded hover:bg-yellow-300 transition-colors text-yellow-900"
                                                >
                                                    <span className="text-sm font-bold">+</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Flip Controls */}
                                        <div>
                                            <label className="text-sm font-medium text-yellow-900 mb-2 block">
                                                Flip Image
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => toggleFlip('horizontal')}
                                                    className={`px-2 py-2 text-xs sm:text-sm rounded transition-colors flex items-center justify-center gap-1 ${flip.horizontal
                                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                        : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                                                        }`}
                                                >
                                                    <span>↔ Horizontal</span>
                                                </button>
                                                <button
                                                    onClick={() => toggleFlip('vertical')}
                                                    className={`px-2 py-2 text-xs sm:text-sm rounded transition-colors flex items-center justify-center gap-1 ${flip.vertical
                                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                        : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                                                        }`}
                                                >
                                                    <span>↕ Vertical</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Current Crop Info */}
                                        <div className="bg-yellow-100 rounded-lg p-3 border border-yellow-300">
                                            <h5 className="text-xs font-medium text-yellow-900 mb-1">Crop Details</h5>
                                            <div className="text-xs text-yellow-700 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Width:</span>
                                                    <span>{Math.round(crop.width)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Height:</span>
                                                    <span>{Math.round(crop.height)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Position X:</span>
                                                    <span>{Math.round(crop.x)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Position Y:</span>
                                                    <span>{Math.round(crop.y)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Fixed at bottom */}
                                <div className="p-3 sm:p-4 border-t bg-yellow-100 shrink-0">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={handleCropCancel}
                                            className="flex-1 px-4 py-3 bg-yellow-200 text-yellow-900 rounded-lg hover:bg-yellow-300 transition-colors font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCropSave}
                                            className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                                        >
                                            Apply Crop
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add custom styles for yellow slider */}
            <style jsx>{`
                .slider-thumb-yellow::-webkit-slider-thumb {
                    appearance: none;
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: #d97706;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .slider-thumb-yellow::-moz-range-thumb {
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: #d97706;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .slider-thumb-yellow::-webkit-slider-track {
                    height: 8px;
                    background: #fef3c7;
                    border-radius: 4px;
                }
                .slider-thumb-yellow::-moz-range-track {
                    height: 8px;
                    background: #fef3c7;
                    border-radius: 4px;
                    border: none;
                }
            `}</style>
        </div>
    );
}