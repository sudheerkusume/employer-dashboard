// app/admin/applications/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminApplications() {
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [limit] = useState(10); // Items per page

    // Check admin role (simple placeholder – replace with real auth)
    useEffect(() => {
        const role = localStorage.getItem("userRole") || localStorage.getItem("mlm_user_code");
        if (role !== "admin") {
            router.push("/"); // or login page
        }
    }, [router]);

    const fetchApplications = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/application?status=pending&page=${page}&limit=${limit}`);
            const data = await res.json();
            if (data.success) {
                setApplications(data.applications);
                // Update pagination state
                setCurrentPage(data.pagination.currentPage);
                setTotalPages(data.pagination.totalPages);
                setTotalRecords(data.pagination.totalRecords);
                setHasNext(data.pagination.hasNext);
                setHasPrev(data.pagination.hasPrev);
            } else {
                setError(data.error || "Failed to fetch applications");
            }
        } catch (err) {
            console.error(err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications(1);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchApplications(newPage);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedApp) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/application", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedApp._id,
                    status,
                    remarks,
                }),
            });
            const data = await res.json();
            if (data.success) {
                // Remove the updated application from the list
                setApplications((prev) => prev.filter((app) => app._id !== selectedApp._id));
                setSelectedApp(null);
                setRemarks("");
                // If the list becomes empty and there are more pages, go to previous page
                if (applications.length === 1 && currentPage > 1) {
                    fetchApplications(currentPage - 1);
                } else if (applications.length === 1 && currentPage === 1) {
                    // Re-fetch current page to update total count
                    fetchApplications(currentPage);
                }
            } else {
                alert(data.error || "Failed to update");
            }
        } catch (err) {
            console.error(err);
            alert("Network error");
        } finally {
            setActionLoading(false);
        }
    };

    const openReviewModal = (app) => {
        setSelectedApp(app);
        setRemarks("");
    };

    const closeModal = () => {
        setSelectedApp(null);
        setRemarks("");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">
                    Pending Applications ({totalRecords})
                </h1>
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                {applications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                        No pending applications.
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.map((app) => (
                                    <tr key={app._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.applicationId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.fullName || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.contactNo || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.referredById || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => openReviewModal(app)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!hasPrev}
                            className={`px-4 py-2 border rounded-md ${hasPrev
                                ? 'bg-white text-gray-700 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Previous
                        </button>
                        <div className="flex space-x-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else {
                                    // Show pages around current page
                                    if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-2 border rounded-md ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!hasNext}
                            className={`px-4 py-2 border rounded-md ${hasNext
                                ? 'bg-white text-gray-700 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Modal (unchanged) */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Application Review</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Application Details (unchanged) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Application ID</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.applicationId}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.fullName || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.dob ? new Date(selectedApp.dob).toLocaleDateString() : "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.fatherName || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.bloodGroup || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.address || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact No</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.contactNo || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.email || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.pinCode || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.panNumber || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.aadharNumber || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Referred By</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.referredById || "-"}</p>
                                </div>

                                {/* Emergency Contacts */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Emergency Contacts</label>
                                    {selectedApp.emergencyContacts?.length ? (
                                        <div className="mt-1 space-y-2">
                                            {selectedApp.emergencyContacts.map((contact, idx) => (
                                                <div key={idx} className="text-sm text-gray-900">
                                                    {contact.name} ({contact.relationship}) – {contact.phone} – {contact.location}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-500">-</p>
                                    )}
                                </div>

                                {/* Employment & Education */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Previous Company</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.previousCompany || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Previous Designation</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.previousDesignation || "-"}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Educational Qualification</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.educationalQualification || "-"}</p>
                                </div>

                                {/* Legal Cases */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Legal Cases Pending</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.legalCasesPending || "-"}</p>
                                </div>

                                {/* Bank Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name as per Bank</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.nameAsPerBank || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.bankName || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.accountNo || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.ifscCode || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Branch</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.branch || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bank City</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.bankCity || "-"}</p>
                                </div>

                                {/* Declaration */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Declaration Note</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.declarationNote || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Declaration</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.declaration ? "Accepted" : "Not Accepted"}</p>
                                </div>

                                {/* Signatures */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Applicant Signature</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.applicantSignature ? "[Signature]" : "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Referrer Signature</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.referrerSignature ? "[Signature]" : "-"}</p>
                                </div>
                            </div>

                            {/* Remarks and Actions (unchanged) */}
                            <div className="border-t pt-4">
                                <div className="mb-4">
                                    <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks (optional)
                                    </label>
                                    <textarea
                                        id="remarks"
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add any remarks (will be recorded)"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus("rejected")}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? "Processing..." : "Reject"}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus("approved")}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? "Processing..." : "Approve"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}