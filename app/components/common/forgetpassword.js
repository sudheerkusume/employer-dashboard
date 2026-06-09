"use client";
import React, { useState, Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { EyeIcon, EyeSlashIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import RootContext from "../config/rootcontext";
import Link from "next/link";
import Image from "next/image";

export default function ForgetPassword({ setScreen }) {
    const [inputType, setInputType] = useState("email");
    const [inputValue, setInputValue] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [isUserNotFound, setIsUserNotFound] = useState(false);
    const { setRootContext } = useContext(RootContext);

    const toggleInputType = () => {
        setInputType(inputType === "email" ? "mobile" : "email");
        setInputValue("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Error",
                    message: "New password and confirm password do not match.",
                },
            }));
            return;
        }

        if (newPassword.length < 6) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "warning",
                    title: "Warning",
                    message: "New password must be at least 6 characters long.",
                },
            }));
            return;
        }

        try {
            setLoading(true);
            const payload = {
                [inputType]: inputValue,
                newPassword,
            };

            const res = await fetch("/api/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Successful",
                        message: `${data.message || "Password updated successfully!"}`,
                    },
                }));
                setNewPassword("");
                setConfirmPassword("");
                setScreen("login");
            } else if (res.status === 404) {
                setIsUserNotFound(true);
            } else {
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: `${data.error || "Something went wrong."}`,
                    },
                }));
            }
        } catch (err) {
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Network error, please try again.",
                },
            }));
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordInput = (id, label, value, setValue, showKey) => (
        <div className="relative">
            <input
                type={showPassword[showKey] ? "text" : "password"}
                id={id}
                placeholder={label}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
            />
            <button
                type="button"
                onClick={() =>
                    setShowPassword((prev) => ({
                        ...prev,
                        [showKey]: !prev[showKey],
                    }))
                }
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
                {showPassword[showKey] ? (
                    <EyeSlashIcon className="h-5 w-5" />
                ) : (
                    <EyeIcon className="h-5 w-5" />
                )}
            </button>
        </div>
    );

    return (
        <div className="flex h-screen w-full items-center justify-center text-gray-800 bg-[#D79A2F] p-4">
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                {/* Close Button (inside white div, top-right corner) */}
                <button
                    onClick={() => setScreen("login")}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#D79A2F] text-white hover:bg-[#c98a29]"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <Link href="/" className="flex justify-center mb-4">
                    <Image src="/salesbeez_logo1.png" alt="Logo" width={200} height={200} />
                </Link>

                <p className="mb-6 text-sm text-gray-600">
                    Enter your{" "}
                    {inputType === "email" ? "email" : "mobile number"} and we'll send you a
                    link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <input
                        type={inputType === "email" ? "email" : "tel"}
                        placeholder={inputType === "email" ? "Email address" : "Mobile number"}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        required
                    />

                    {renderPasswordInput("newPassword", "New Password", newPassword, setNewPassword, "new")}
                    {renderPasswordInput("confirmPassword", "Confirm Password", confirmPassword, setConfirmPassword, "confirm")}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#D79A2F] p-3 font-semibold text-white shadow-md transition duration-200 hover:rounded-full hover:bg-[#c98a29] disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                <button
                    onClick={toggleInputType}
                    className="mt-4 w-full border border-[#D79A2F] rounded-lg hover:rounded-full p-3 text-sm font-semibold text-[#D79A2F] transition-colors duration-200 hover:bg-[#D79A2F] hover:text-white"
                >
                    Search by{" "}
                    {inputType === "email"
                        ? "mobile number instead"
                        : "email address instead"}
                </button>
            </div>

            {/* User Not Found Modal */}
            <Modal
                isOpen={isUserNotFound}
                onClose={() => setIsUserNotFound(false)}
                title="User Not Found"
                icon={<InformationCircleIcon className="h-10 w-10 text-[#D79A2F]" />}
            >
                <p>
                    The user you are trying to find was not found. Please check the {inputType} and try again.
                </p>
            </Modal>
        </div>
    );
}

/* ----------------------------
    Reusable Headless UI Modal
----------------------------- */
function Modal({ isOpen, onClose, title, icon, children }) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl relative">
                            {/* Close button inside modal */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#D79A2F] text-white hover:bg-[#c98a29]"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                            {icon && (
                                <div className="mb-4 flex items-center justify-center">
                                    {icon}
                                </div>
                            )}

                            <Dialog.Title className="text-lg font-bold text-gray-800 mb-2">
                                {title}
                            </Dialog.Title>

                            <div className="text-sm text-gray-600">{children}</div>

                            <button
                                onClick={onClose}
                                className="mt-6 w-full rounded-lg bg-[#D79A2F] p-3 font-semibold text-white shadow-md hover:bg-[#c98a29]"
                            >
                                Close
                            </button>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
