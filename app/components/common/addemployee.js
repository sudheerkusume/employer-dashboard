"use client";
import React, { useContext, useEffect, useState } from "react";
import { useSWRFetch } from "../config/useswrfetch";
import ComboBox from "./form/combobox";
import RootContext from "../config/rootcontext";

export default function AddEmployeeForm({ currentUserRole, editData, onSuccess }) {
    const isEdit = !!editData?._id;
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
    const { setRootContext } = useContext(RootContext);

    // Fetch all employees to get manager list (for reporting manager dropdown)
    const { data, error } = useSWRFetch(`/api/employees`);
    const managerData = data
        ?.filter(item => ["manager", "admin", "super_admin"].includes(item.role))
        ?.map(item => ({ _id: item._id, name: item.name }));

    // Populate form when editing
    useEffect(() => {
        if (editData) {
            setForm({
                name: editData.name || "",
                email: editData.email || "",
                role: editData.role || "employee",
                password: "", // password field left empty for edit
                manager: editData.reportingId
                    ? { _id: editData.reportingId, name: editData.reportingManager || "" }
                    : {},
                mobile: editData.mobile || "",
                dateOfJoining: editData.dateOfJoining ? editData.dateOfJoining.split("T")[0] : "",
                dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split("T")[0] : "",
                gender: editData.gender || "male",
                designation: editData.designation || "",
                department: editData.department || "",
                ctc: editData.ctc || ""
            });
        }
    }, [editData]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                department: form.department,
                ctc: form.ctc,
            };

            let url = "/api/employees";
            let method = "POST";

            if (isEdit) {
                url = `/api/employees?id=${editData._id}`;
                method = "PUT";
                // On PUT, include id in body (the route expects id field)
                payload.id = editData._id;
                // If password is empty, don't send it (so it won't be overwritten)
                if (!payload.password) delete payload.password;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Operation failed");

            setRootContext((prev) => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "success",
                    title: "Success",
                    message: isEdit ? "Employee updated successfully!" : "Employee added successfully!",
                },
            }));

            if (onSuccess) onSuccess(); // close modal & refresh list
        } catch (err) {
            console.log(err);
            setRootContext((prev) => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: err.message,
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
        <div className="w-full mx-auto bg-white overflow-y-auto shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold text-center text-orange-600 mb-4">
                {isEdit ? "Edit Employee" : "Add New Employee"}
            </h2>

            {error && <p className="text-red-600 mb-3">{error}</p>}

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

                {/* Department */}
                <ComboBox
                    title={"Department"}
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

                {/* Designation */}
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

                {/* CTC */}
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

                {/* Password - only required for new employee */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">
                        {isEdit ? "New Password (leave blank to keep current)" : "Password"}
                    </label>
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        required={!isEdit}
                    />
                </div>

                <div className="w-40 flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-700 hover:bg-yellow-800"
                            }`}
                    >
                        {loading ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update Employee" : "Add Employee")}
                    </button>
                </div>
            </form>
        </div>
    );
}