"use client";
import React, { useState, useEffect, useContext } from "react";
import { EyeSlashIcon, PencilIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, EyeIcon } from "@heroicons/react/20/solid";
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

export default function EmployeeProfile({ employeesData }) {
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        profileImage: "",
        summary: "",
        password: "",
        experience: [],
        education: [],
        attendance: {},
    });
    const [tempProfile, setTempProfile] = useState(profile);
    const [editingHeader, setEditingHeader] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(null);
    const [serviceCall, setServiceCall] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

    // Handle image preview
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setTempProfile((prev) => ({ ...prev, imageFile: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // Save employee profile
    const handleSaveHeader = async () => {
        setServiceCall(true);
        try {
            const formData = new FormData();
            formData.append("id", employeeID);
            formData.append("name", tempProfile.name || "");
            formData.append("email", tempProfile.email || "");
            formData.append("role", role);
            if (tempProfile.password) formData.append("password", tempProfile.password);
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
                setProfile((prev) => ({ ...prev, ...data.updatedFields }));
                setTempProfile((prev) => ({ ...prev, ...data.updatedFields }));
                setEditingHeader(false);
                setPreviewImage("");
                mutated();
            } else {
                console.log(data.error || "Failed to update profile");
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
        router.push("/")
    };

    return (
        <div className="mt-20 bg-white min-h-screen">
            {serviceCall && <Loading />}
            <div className="absolute top-4 right-4">
                <button
                    onClick={logOut}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
            <div className="max-w-5xl border border-gray-200 bg-white rounded-t-xl mx-auto relative shadow-sm">
                <div className="p-6 flex flex-col sm:flex-row items-center gap-4 relative z-10">
                    {/* Profile Image Upload */}
                    <div className="absolute -top-12 left-6 sm:left-6">
                        <label htmlFor="profileImageInput" className="cursor-pointer group relative">
                            <input
                                id="profileImageInput"
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                            />
                            <img
                                src={
                                    previewImage ||
                                    tempProfile.profileImage ||
                                    profile.profileImage ||
                                    "https://placehold.co/80x80/F0F0F0/000000?text=Profile"
                                }
                                alt="Avatar"
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white object-fit shadow-lg"
                            />
                            {editingHeader && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs bg-opacity-25 rounded-xl text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                    Change
                                </div>
                            )}
                        </label>
                    </div>


                    <div className="flex mt-10 sm:mt-1 justify-between sm:items-center gap-3 w-full ml-0 sm:ml-40">
                        {editingHeader ? (
                            <div className="flex flex-col w-full gap-2 text-gray-700">
                                <input
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.name || ""}
                                    placeholder="Enter Full Name"
                                    onChange={(e) =>
                                        setTempProfile({ ...tempProfile, name: e.target.value })
                                    }
                                />
                                <input
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                    value={tempProfile.email || ""}
                                    onChange={(e) =>
                                        setTempProfile({ ...tempProfile, email: e.target.value })
                                    }
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
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
                                        className="px-3 py-1 bg-blue-600 text-white rounded"
                                        onClick={handleSaveHeader}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="px-3 py-1 border border-gray-400 rounded"
                                        onClick={() => setEditingHeader(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-xs sm:text-sm text-gray-500">Email: {profile.email}</p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Date of Joining: {formatDateTime(profile.dateOfJoining, "DD-MM-YYYY")}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Date of Birth: {formatDateTime(profile.dateOfbirth, "DD-MM-YYYY")}
                                </p>
                            </div>
                        )}
                        {!editingHeader && rootContext?.user?.role !== "recruiter" && (
                            <button
                                onClick={() => {
                                    setEditingHeader(true);
                                    setTempProfile(profile);
                                    setShowPassword(false);
                                }}
                                className="text-gray-600 hover:text-gray-900 mt-2 sm:mt-0"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 max-w-5xl mx-auto px-4 py-6 rounded-b-md shadow-sm">
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
                                            <span className="font-medium text-gray-700 text-sm">{tab.name}</span>
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
        </div>
    );
}
