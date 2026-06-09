"use client";
import React, { useState, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import RootContext from "../config/rootcontext";
import { EyeIcon } from "@heroicons/react/20/solid";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useSWRFetch } from "../config/useswrfetch";
import ForgetPassword from "./forgetpassword";
import { motion } from "framer-motion";

const staticEmployees = [
    {
        _id: "super_admin_001",
        name: "Admin",
        email: "superadmin@realbeez.com",
        mobile: "9999999999",
        password: "Superadmin@123",
        role: "super_admin",
        isActive: true
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
    const { data = [], error } = useSWRFetch(`/api/employees?email=${formData.email}`)
    const modifiedData = data?.map(item => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        password: item.password,
        role: item.role,
        isActive: item.isActive
    }))

    const usersData = [...staticEmployees, ...modifiedData]
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [screen, setScreen] = useState("login");

    const onSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const user = usersData.find((u) => u.email === formData.email);
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

        if (user.isActive === false) {
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Account Disabled",
                    message: "Your account is currently inactive. Please contact HR admin.",
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

        // ✅ Successful login
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
                isActive: user.isActive,
            },
        };

        setRootContext({
            ...resp,
            toast: {
                show: true,
                dismiss: true,
                type: "success",
                title: "Login Successful",
                message: "Welcome back!",
            },
        });
        if (user.role === "employee") {
            router.push("/dashboard/employee")
        } else if (user.role === "admin") {
            router.push("/dashboard/admin")
        } else if (user.role === "super_admin") {
            router.push("/dashboard/admin")
        } else {
            router.push("/dashboard/manager")
        }
        localStorage.setItem("user_details", JSON.stringify(resp.user));
        setIsLoading(false);
    };

    return (
        <div>
            {screen === "login" ? (
                <div className="flex h-screen w-full items-center justify-center bg-[#D79A2F] p-4 relative overflow-hidden">
                    {/* Background animated circles for a more premium look */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.1, scale: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                        className="absolute w-[600px] h-[600px] bg-white rounded-full blur-3xl -top-[200px] -left-[200px] pointer-events-none"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.05, scale: 1.2 }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", delay: 1 }}
                        className="absolute w-[800px] h-[800px] bg-white rounded-full blur-3xl -bottom-[300px] -right-[300px] pointer-events-none"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] p-6 z-10"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="-mb-1"
                        >
                            <Link href="/" className="flex justify-center transition-transform hover:scale-105 duration-300">
                                <Image
                                    src="/salesbeez_logo1.png"
                                    alt="Logo"
                                    width={270}
                                    height={270}
                                    priority
                                    className="object-contain"
                                />
                            </Link>
                        </motion.div>
                        <form onSubmit={onSave} className="w-full bg-white text-gray-700 md:mt-0 sm:max-w-md xl:p-0 relative z-20">
                            <div className="px-6 pb-6 pt-0 space-y-4 md:space-y-6 sm:px-8 sm:pb-8">
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center"
                                >
                                    Sign In Securely
                                </motion.h1>
                                <div className="space-y-4 md:space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                    >
                                        <input
                                            title={"Email or Mobile"}
                                            type={"text"}
                                            placeholder={"Email or phone number"}
                                            className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            errormsg={"Enter Valid Email"}
                                            required={true}
                                        />
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.5 }}
                                        className="relative"
                                    >
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            )}
                                        </span>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.6 }}
                                        className="flex justify-end"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setScreen("otp")}
                                            className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 hover:underline transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </motion.div>

                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.7 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className={`w-full p-3 rounded-lg font-bold text-white shadow-md transition-colors duration-300
                                          ${isLoading ? 'bg-yellow-400 cursor-not-allowed' : 'bg-[#D79A2F] cursor-pointer hover:bg-yellow-600 hover:shadow-lg'}
                                        `}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Signing in...' : 'Log In'}
                                    </motion.button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <ForgetPassword setScreen={setScreen} />
                </motion.div>
            )}
        </div>
    );
}
