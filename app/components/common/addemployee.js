"use client";
import React, { useState } from "react";

export default function AddEmployeeForm({ currentUserRole }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "employee",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Only admin can submit
        if (currentUserRole !== "admin") {
            setError("You do not have access to add employees.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, currentUserRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to add employee.");
            } else {
                setSuccess("Employee added successfully!");
                setForm({ name: "", email: "", role: "employee", password: "" });
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong while adding employee.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Employee</h2>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {success && <p className="text-green-600 mb-3">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                        Name
                    </label>
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
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                        Email
                    </label>
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
                <div>
                    <label htmlFor="role" className="block text-gray-700 font-medium mb-1">
                        Role
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="employee">Employee</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
                        Password
                    </label>
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
                    className={`w-full py-2 px-4 rounded-md font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {loading ? "Adding..." : "Add Employee"}
                </button>
            </form>
        </div>
    );
}
