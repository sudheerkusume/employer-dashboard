"use client";
import React, { useState, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import RootContext from "../config/rootcontext";
import { EyeIcon } from "@heroicons/react/20/solid";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import ForgetPassword from "./forgetpassword";

const staticEmployees = [
    {
        _id: "super_admin_001",
        name: "Super Admin",
        email: "superadmin@realbeez.com",
        mobile: "9999999999",
        password: "Superadmin@123",
        role: "super_admin"
    }
];

export default function LoginRoot() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const router = useRouter();
    const [formData, setFormData] = useState({
        mobile: "",
        email: "",
        password: "",
        remember: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [screen, setScreen] = useState("login");

    const onSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Find user by email (or mobile - you can extend)
        const user = staticEmployees.find((u) => u.email === formData.email);

        if (!user) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Login Failed",
                    message: "User not found. Please sign up.",
                },
            }));
            setIsLoading(false);
            return;
        }

        const isMatch = formData.password === user.password;

        if (!isMatch) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Login Failed",
                    message: "Incorrect password. Please try again.",
                },
            }));
            setIsLoading(false);
            return;
        }

        // Successful login
        const username = user.name || user.email?.split("@")[0];
        const resp = {
            ...rootContext,
            authenticated: true,
            loader: false,
            user: {
                name: username,
                userId: user._id,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
        };

        setRootContext({
            ...resp,
            toast: {
                show: true,
                dismiss: true,
                type: "success",
                title: "Login Successful",
                message: `Welcome back, ${username}!`,
            },
        });

        // Store user in localStorage
        localStorage.setItem("user_details", JSON.stringify(resp.user));

        // Role-based redirection
        switch (user.role) {
            case "super_admin":
                router.push("/dashboard/admin");
                break;
            case "admin":
                router.push("/dashboard/admin");
                break;
            case "employee":
                router.push("/dashboard/employee");
                break;
            default:
                router.push("/dashboard/manager");
        }

        setIsLoading(false);
    };

    return (
        <div>
            {screen === "login" ? (
                <div className="flex h-screen w-full items-center justify-center bg-[#D79A2F] p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                        <Link href="/" className="flex justify-center mb-4">
                            <Image src="/realbeez.png" alt="Logo" width={200} height={200} />
                        </Link>
                        <form
                            onSubmit={onSave}
                            className="w-full bg-white text-gray-700 md:mt-0 sm:max-w-md xl:p-0"
                        >
                            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                    Sign in to your account
                                </h1>
                                <div className="space-y-4 md:space-y-6">
                                    <input
                                        title="Email or Mobile"
                                        type="text"
                                        placeholder="Email or phone number"
                                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        required={true}
                                    />

                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-500"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            required
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

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setScreen("otp")}
                                            className="text-sm font-semibold text-yellow-500 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`w-full p-3 rounded-lg hover:rounded-full font-bold text-white transition-colors duration-300 ${isLoading
                                            ? "bg-yellow-400 cursor-not-allowed"
                                            : "bg-yellow-600 cursor-pointer hover:bg-yellow-700"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Loading..." : "Log In"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <ForgetPassword setScreen={setScreen} />
            )}
        </div>
    );
}