"use client";
import React, { useContext, useState } from "react";
import { useSWRFetch } from "../config/useswrfetch";
import ComboBox from "./form/combobox";
import RootContext from "../config/rootcontext";

export default function AddEmployeeForm({ currentUserRole }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "employee",
        password: "",
        manager: {},
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const { setRootContext } = useContext(RootContext);

    const { data, error, isLoading } = useSWRFetch(`/api/employees`);
    const managerData = data && data
        ?.filter(item => item.role === "manager")
        ?.map(item => ({
            _id: item._id,
            name: item.name
        }));

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess("");

        setLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                role: form.role,
                password: form.password,
                reportingId: form.manager?._id || null, // only send _id
                currentUserRole,
            };

            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccess("Employee added successfully!");
                setForm({ name: "", email: "", role: "employee", password: "", reportingId: "" });
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "success",
                        message: "Employee added successfully!",
                    },
                }));
            }
        } catch (err) {
            console.error(err);
            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: `${err.message}`,
                },
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleManagerChange = (selectedManager) => {
        setForm({ ...form, manager: selectedManager });
    };

    const handleRoleChange = (selectedRole) => {
        setForm({ ...form, role: selectedRole });
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Employee</h2>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {success && <p className="text-green-600 mb-3">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* Role */}
                <ComboBox title={"Role"} data={["employee", "manager"]} required={true} value={form.role} onChange={handleRoleChange} />

                {/* Reporting Manager */}
                <ComboBox title={"Reporting Manager"} textField={"name"} data={managerData} required={true} value={form.manager} onChange={handleManagerChange} />

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                    {loading ? "Adding..." : "Add Employee"}
                </button>
            </form>
        </div>
    );
}
