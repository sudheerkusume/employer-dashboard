"use client";
import React, { useState, useEffect, useContext } from "react";
import Cropper from "react-easy-crop";
import { EyeSlashIcon, PencilIcon } from "@heroicons/react/24/solid";
import { EyeIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import AboutMe from "./about";
import Attendance from "./attendance";
import HRPolicy from "./hrpolicy";
import Payslip from "./payslip";
import ButtonTab from "../common/buttontab";
import RootContext from "../config/rootcontext";
import { Mutated } from "../config/useswrfetch";
import Loading from "../common/loading";
import { formatDateTime } from "../config/sitesettings";
import { getCroppedImg } from "../common/croputils";
import { useRouter } from "next/navigation";

const tabs = [
    { name: "About Me", component: AboutMe },
    { name: "Attendance", component: Attendance },
    { name: "HR Policy", component: HRPolicy },
    { name: "Payslips", component: Payslip },
];

export default function EmployeeProfile({ employeesData }) {
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState({});
    const [tempProfile, setTempProfile] = useState({});
    const [editingHeader, setEditingHeader] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [cropping, setCropping] = useState(false);
    const [cropImage, setCropImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
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

    /** ─── Image Upload + Crop ───────────────────────────────── **/
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropImage(reader.result);
            setCropping(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (_, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    /** Save cropped image only when confirmed **/
    const handleCropSave = async () => {
        try {
            const croppedImgBlob = await getCroppedImg(cropImage, croppedAreaPixels);
            const previewUrl = URL.createObjectURL(croppedImgBlob);
            const croppedFile = new File([croppedImgBlob], "profile.jpg", {
                type: "image/jpeg",
            });

            // ✅ Only update image, keep all other data intact
            setPreviewImage(previewUrl);
            setTempProfile((prev) => ({
                ...prev,
                imageFile: croppedFile,
            }));

            setCropping(false);
            setCropImage(null);
        } catch (err) {
            console.error("Crop failed:", err);
        }
    };

    /** Cancel cropping — no state change **/
    const handleCropCancel = () => {
        setCropping(false);
        setCropImage(null);
    };

    /** ─── Save Employee Header ───────────────────────────────── **/
    const handleSaveHeader = async () => {
        setServiceCall(true);
        try {
            const formData = new FormData();
            formData.append("id", employeeID);
            formData.append("name", tempProfile.name || "");
            formData.append("panNumber", tempProfile.panNumber || "");
            formData.append("role", role);
            if (tempProfile.password)
                formData.append("password", tempProfile.password);
            if (tempProfile.imageFile)
                formData.append("image", tempProfile.imageFile);
            if (tempProfile.summary) formData.append("summary", tempProfile.summary);
            if (tempProfile.experience) formData.append("experience", JSON.stringify(tempProfile.experience));
            if (tempProfile.education) formData.append("education", JSON.stringify(tempProfile.education));
            if (tempProfile.attendance) formData.append("attendance", JSON.stringify(tempProfile.attendance));
            if (tempProfile.imageFile) formData.append("image", tempProfile.imageFile); // cloud upload
            const res = await fetch(`/api/employees`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();
            setServiceCall(false);

            if (res.ok) {
                setProfile((prev) => ({
                    ...prev,
                    ...data.updatedFields, // ✅ merge updated fields
                }));
                setTempProfile((prev) => ({
                    ...prev,
                    ...data.updatedFields,
                }));
                setEditingHeader(false);
                mutated();
            } else {
                console.error(data.error || "Failed to update profile");
            }
        } catch (err) {
            console.error("Update Error:", err);
            setServiceCall(false);
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
                                type="file"
                                accept="image/*"
                                disabled={!editingHeader} // 🔒 Disable when not in edit mode
                                className={`absolute inset-0 w-full h-full opacity-0 ${editingHeader ? "cursor-pointer" : "cursor-not-allowed"
                                    }`}
                                onChange={editingHeader ? handleImageChange : undefined} // ✅ Only handle when editing
                            />
                            <div className="relative w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                                <img
                                    src={
                                        previewImage ||
                                        tempProfile.profileImage ||
                                        profile.profileImage ||
                                        "https://placehold.co/150x150"
                                    }
                                    alt="Avatar"
                                    className="max-w-full max-h-full object-contain"
                                />
                                {editingHeader && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    className="w-full px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.name || ""}
                                    placeholder="Enter Full Name"
                                    onChange={(e) =>
                                        setTempProfile({ ...tempProfile, name: e.target.value })
                                    }
                                />
                                <input
                                    className="w-full px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.panNumber || ""}
                                    placeholder="Enter PAN Number"
                                    onChange={(e) =>
                                        setTempProfile({
                                            ...tempProfile,
                                            panNumber: e.target.value,
                                        })
                                    }
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                        value={tempProfile.password || ""}
                                        onChange={(e) =>
                                            setTempProfile({
                                                ...tempProfile,
                                                password: e.target.value,
                                            })
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
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        onClick={handleSaveHeader}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                                        onClick={() => setEditingHeader(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {profile.name}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Pan Number: {profile.panNumber}
                                </p>
                                <p className="text-sm text-gray-500">Email: {profile.email}</p>
                                <p className="text-sm text-gray-500">
                                    Employee Code: {profile?.employeeCode}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Designation: {profile?.designation}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Date of Joining:{" "}
                                    {formatDateTime(profile.dateOfJoining, "DD-MM-YYYY")}
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
                            <ButtonTab
                                tabs={tabs}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
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
                                            onClick={() =>
                                                setAccordionOpen(isOpen ? null : index)
                                            }
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

            {/* Crop Modal */}
            {cropping && (
                <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                    <div className="relative bg-white rounded-lg p-4 w-[90%] sm:w-[400px] h-[400px] flex flex-col">
                        <div className="flex-1 relative">
                            <Cropper
                                image={cropImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={handleCropCancel}
                                className="px-4 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropSave}
                                className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                                Crop & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
