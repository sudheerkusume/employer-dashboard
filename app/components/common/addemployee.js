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
        mobile: "",
        dateOfJoining: "",
        dateOfBirth: "",
        gender: "male",
        designation: "",
        department: "",
        ctc: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const { setRootContext } = useContext(RootContext);

    const { data, error } = useSWRFetch(`/api/employees`);
    const managerData = data
        ?.filter(item => item.role === "manager")
        ?.map(item => ({ _id: item._id, name: item.name }));

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
                reportingId: form.manager?._id || null,
                reportingManager: form.manager?.name || null,
                mobile: form.mobile,
                dateOfJoining: form.dateOfJoining,
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
                designation: form.designation,
                ctc: form.ctc,
                currentUserRole,
            };

            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccess("Employee added successfully!");
                setForm({
                    name: "",
                    email: "",
                    role: "employee",
                    password: "",
                    manager: {},
                    mobile: "",
                    dateOfJoining: "",
                    dateOfBirth: "",
                    gender: "male",
                    designation: "",
                    ctc: ""
                });
                setRootContext((prev) => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Success",
                        message: "Employee added successfully!",
                    },
                }));
            }
        } catch (err) {
            console.log(err);
            setRootContext((prev) => ({
                ...prev,
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

    const handleGenderChange = (selectedGender) => {
        setForm({ ...form, gender: selectedGender });
    };

    const handleDeptChange = (selectedValue) => {
        setForm({ ...form, department: selectedValue });
    };

    return (
        <div className="w-full mx-auto p-3 bg-white overflow-y-auto shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold text-center text-orange-600 mb-4">Add New Employee</h2>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {success && <p className="text-green-600 mb-3">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Name</label>
                    <input
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Mobile */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Mobile</label>
                    <input
                        name="mobile"
                        type="tel"
                        value={form.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Role */}
                <ComboBox
                    title={"Role"}
                    data={["employee", "manager"]}
                    required={true}
                    value={form.role}
                    onChange={handleRoleChange}
                />
                <ComboBox
                    title={"Deportment"}
                    data={["admin", "sales", "tech"]}
                    required={true}
                    value={form.department}
                    onChange={handleDeptChange}
                />
                {/* Reporting Manager */}
                <ComboBox
                    title={"Reporting Manager"}
                    textField={"name"}
                    data={managerData}
                    required={true}
                    value={form.manager}
                    onChange={handleManagerChange}
                />
                {/* Gender */}
                <ComboBox
                    title={"Gender"}
                    data={["male", "female", "other"]}
                    required={true}
                    value={form.gender}
                    onChange={handleGenderChange}
                />
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Designation</label>
                    <input
                        name="designation"
                        type="text"
                        value={form.designation}
                        onChange={handleChange}
                        placeholder="Enter Designation"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-1">CTC</label>
                    <input
                        name="ctc"
                        type="text"
                        value={form.ctc}
                        onChange={handleChange}
                        placeholder="Enter CTC"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Date of Joining */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Date of Joining</label>
                    <input
                        name="dateOfJoining"
                        type="date"
                        value={form.dateOfJoining}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Date of Birth */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Date of Birth</label>
                    <input
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Password</label>
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                <div className="w-40 flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-700 hover:bg-yellow-800"
                            }`}
                    >
                        {loading ? "Adding..." : "Add Employee"}
                    </button>
                </div>
            </form>
        </div>
    );
}
