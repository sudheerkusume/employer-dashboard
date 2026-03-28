// app/mlm/sales/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

export default function RecordSale() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userCode, setUserCode] = useState("");

    const [formData, setFormData] = useState({
        amount: "",
        description: "",
        productId: ""
    });

    useEffect(() => {
        const code = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
        if (code) {
            setUserCode(code);
        } else {
            setError("No user code found");
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || formData.amount <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/mlm/commission", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userCode,
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    productId: formData.productId || null
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(`Sale recorded successfully! Commission distributed.`);
                setFormData({
                    amount: "",
                    description: "",
                    productId: ""
                });
                setTimeout(() => {
                    router.push("/mlm/dashboard");
                }, 2000);
            } else {
                setError(data.error || "Failed to record sale");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="bg-white text-gray-900 w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-6">Record Sale</h1>
                    <p className="text-gray-600 mb-4">
                        Recording sale for: <span className="font-semibold">{userCode}</span>
                    </p>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sale Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                required
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="Enter amount in INR"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Product or service description"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Product ID (Optional)</label>
                            <input
                                type="text"
                                name="productId"
                                value={formData.productId}
                                onChange={handleChange}
                                placeholder="Product code or ID"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h3 className="font-semibold mb-2">Commission Distribution</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>• ME: 50% of difference</p>
                                <p>• MM: 15% of difference</p>
                                <p>• SMM: 10% of difference</p>
                                <p>• AGM: 7.5% of difference</p>
                                <p>• DGM: 5% of difference</p>
                                <p>• GM: 2.5% of difference</p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? "Recording..." : "Record Sale"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}