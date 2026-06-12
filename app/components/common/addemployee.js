"use client";
import React, { useContext, useEffect, useState } from "react";
import { useSWRFetch } from "../config/useswrfetch";
import ComboBox from "./form/combobox";
import RootContext from "../config/rootcontext";
import InputBox from "./form/inputbox";

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
    const [showCustomDept, setShowCustomDept] = useState(false);
    const [showCustomManager, setShowCustomManager] = useState(false);
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
            const isManagerString = typeof form.manager === 'string';
            const payloadManagerId = isManagerString ? null : form.manager?._id || null;
            const payloadManagerName = isManagerString ? form.manager : form.manager?.name || null;

            const payload = {
                name: form.name,
                email: form.email,
                role: form.role,
                password: form.password,
                reportingId: payloadManagerId,
                reportingManager: payloadManagerName,
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
        <div className="w-full max-w-4xl mx-auto bg-white/95 p-2 border border-gray-50">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                    {isEdit ? "Edit Employee Details" : "Add New Employee"}
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                    {isEdit ? "Update the information below to modify the employee record." : "Fill in the details below to add a new member to the team."}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center">
                    <span className="font-semibold mr-2">Error:</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                {/* Section 1: Personal Info */}
                <div className="p-5 bg-white rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}

                        <InputBox
                            name="name"
                            title="Full Name"
                            value={form.name}
                            type="text"
                            onChange={handleChange}
                            // placeholder="Enter full name"
                            required
                        />

                        {/* Email */}
                        <InputBox
                            name="email"
                            title="Email Address"
                            type="email"
                            autoComplete="off"
                            value={form.email}
                            onChange={handleChange}
                            // placeholder="Enter email"
                            required
                        />

                        {/* Mobile */}
                        <InputBox
                            name="mobile"
                            title="Mobile Number"
                            type="tel"
                            value={form.mobile}
                            onChange={handleChange}
                            // placeholder="Enter mobile number"
                            required
                        />

                        {/* Date of Birth */}
                        <InputBox
                            name="dateOfBirth"
                            title="Date of Birth"
                            type="date"
                            value={form.dateOfBirth}
                            onChange={handleChange}
                            required
                        />

                        {/* Gender */}
                        <div className="col-span-1 md:col-span-2">
                            <ComboBox
                                title={"Gender"}
                                data={["male", "female", "other"]}
                                required={true}
                                value={form.gender}
                                onChange={handleGenderChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Work Info */}
                <div className="p-5 bg-white rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Employment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Role */}
                        <div>
                            <ComboBox
                                title={"Role"}
                                data={["employee", "manager"]}
                                required={true}
                                value={form.role}
                                onChange={handleRoleChange}
                            />
                        </div>

                        {/* Designation */}
                        <InputBox
                            name="designation"
                            title="Designation"
                            type="text"
                            value={form.designation}
                            onChange={handleChange}
                            placeholder="e.g. Software Engineer"
                            required
                        />

                        {/* Department */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                {showCustomDept ? (
                                    <InputBox
                                        name="department"
                                        title="Department"
                                        type="text"
                                        value={form.department}
                                        onChange={handleChange}
                                        placeholder="Enter custom department"
                                        required
                                    />
                                ) : (
                                    <ComboBox
                                        title={"Department"}
                                        data={["admin", "sales", "tech"]}
                                        required={true}
                                        value={form.department}
                                        onChange={handleDeptChange}
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomDept(!showCustomDept);
                                    setForm({ ...form, department: "" });
                                }}
                                className="h-[42px] px-4 mb-[2px] bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center text-sm font-medium transition-colors shadow-sm"
                            >
                                {showCustomDept ? "List" : "+ Add"}
                            </button>
                        </div>

                        {/* Reporting Manager */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                {showCustomManager ? (
                                    <InputBox
                                        name="manager"
                                        title="Reporting Manager"
                                        type="text"
                                        value={form.manager}
                                        onChange={handleChange}
                                        placeholder="Enter custom manager name"
                                        required
                                    />
                                ) : (
                                    <ComboBox
                                        title={"Reporting Manager"}
                                        textField={"name"}
                                        data={managerData}
                                        required={true}
                                        value={form.manager}
                                        onChange={handleManagerChange}
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomManager(!showCustomManager);
                                    setForm({ ...form, manager: "" });
                                }}
                                className="h-[42px] px-4 mb-[2px] bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center text-sm font-medium transition-colors shadow-sm"
                            >
                                {showCustomManager ? "List" : "+ Add"}
                            </button>
                        </div>

                        {/* CTC */}
                        <InputBox
                            name="ctc"
                            title="CTC (Salary)"
                            type="text"
                            value={form.ctc}
                            onChange={handleChange}
                            placeholder="e.g. 5,00,000"
                            required
                        />

                        {/* Date of Joining */}
                        <InputBox
                            name="dateOfJoining"
                            title="Date of Joining"
                            type="date"
                            value={form.dateOfJoining}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Section 3: Security */}
                <div className="p-5 bg-white rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password */}
                        <div className="md:col-span-1">
                            <InputBox
                                name="password"
                                title={isEdit ? "New Password (Optional)" : "Account Password"}
                                type="password"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={isEdit ? "Leave blank to keep current" : "Enter a secure password"}
                                required={!isEdit}
                            />
                            {isEdit && <p className="text-xs text-gray-500 mt-1.5 ml-1">Leave blank if you don't want to change the password.</p>}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full md:w-auto min-w-[220px] py-2.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${loading
                            ? "bg-gray-400 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-orange-500/30"
                            }`}
                    >
                        {loading
                            ? (isEdit ? "Updating Record..." : "Adding Employee...")
                            : (isEdit ? "Save Changes" : "Create Employee Record")}
                    </button>
                </div>
            </form>
        </div>
    );
}