// app/mlm/sales/page.jsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/app/components/lib/mlmUtils";

// Dummy product catalog for demonstration
const DUMMY_PRODUCTS = [
  {
    id: "PROD-001",
    name: "Premium Health Supplement",
    salePrice: 2999,
    costPrice: 1500,
    description: "Advanced formula with natural ingredients",
  },
  {
    id: "PROD-002",
    name: "Wellness Kit",
    salePrice: 4999,
    costPrice: 2800,
    description: "Complete wellness package with 3 products",
  },
  {
    id: "PROD-003",
    name: "Energy Booster Pack",
    salePrice: 1599,
    costPrice: 800,
    description: "30-day energy supplement pack",
  },
  {
    id: "PROD-004",
    name: "Detox Combo",
    salePrice: 3499,
    costPrice: 1900,
    description: "Natural detoxification program",
  },
];

// Commission structure based on MLM PPT
const COMMISSION_STRUCTURE = [
  { rank: "ME", fullName: "Member", percentage: 50, level: 1 },
  { rank: "MM", fullName: "Master Member", percentage: 15, level: 2 },
  { rank: "SMM", fullName: "Senior Master Member", percentage: 10, level: 3 },
  { rank: "AGM", fullName: "Assistant General Manager", percentage: 7.5, level: 4 },
  { rank: "DGM", fullName: "Deputy General Manager", percentage: 5, level: 5 },
  { rank: "GM", fullName: "General Manager", percentage: 2.5, level: 6 },
];

export default function RecordSale() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userCode, setUserCode] = useState("");
  const [selectedDummyProduct, setSelectedDummyProduct] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    productId: "",
  });

  // Load user code from URL or localStorage
  useEffect(() => {
    const code = searchParams.get("userCode") || localStorage.getItem("mlm_user_code");
    if (code) {
      setUserCode(code);
    } else {
      setError("No user code found");
    }
  }, [searchParams]);

  // Handle dummy product selection
  useEffect(() => {
    if (selectedDummyProduct) {
      const product = DUMMY_PRODUCTS.find((p) => p.id === selectedDummyProduct);
      if (product) {
        setFormData({
          amount: product.salePrice.toString(),
          description: product.description,
          productId: product.id,
        });
        setCostPrice(product.costPrice.toString());
      }
    } else {
      setCostPrice("");
    }
  }, [selectedDummyProduct]);

  // Calculate profit and commission preview based on sale amount and cost price
  const commissionPreview = useMemo(() => {
    const saleAmount = parseFloat(formData.amount);
    const cost = parseFloat(costPrice);
    
    if (isNaN(saleAmount) || saleAmount <= 0 || isNaN(cost) || cost < 0) {
      return null;
    }
    
    const profit = saleAmount - cost;
    if (profit <= 0) {
      return { profit, distributions: [], totalCommission: 0 };
    }
    
    let remainingProfit = profit;
    const distributions = COMMISSION_STRUCTURE.map((level) => {
      const commissionAmount = (profit * level.percentage) / 100;
      remainingProfit -= commissionAmount;
      return {
        ...level,
        commissionAmount,
      };
    });
    
    return {
      profit,
      distributions,
      totalCommission: profit - remainingProfit,
      companyProfit: remainingProfit,
    };
  }, [formData.amount, costPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset dummy selection if user manually changes fields
    if (name === "amount" || name === "productId" || name === "description") {
      setSelectedDummyProduct("");
    }
  };

  const handleCostPriceChange = (e) => {
    setCostPrice(e.target.value);
    setSelectedDummyProduct("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userCode,
          amount: parseFloat(formData.amount),
          description: formData.description,
          productId: formData.productId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Sale recorded successfully! Commission distributed.`);
        setFormData({
          amount: "",
          description: "",
          productId: "",
        });
        setCostPrice("");
        setSelectedDummyProduct("");
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

          {/* Commission Structure Table */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              MLM Commission Structure (as per PPT)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-200">
                    <th className="text-left py-2 px-3 font-semibold text-blue-700">Rank</th>
                    <th className="text-left py-2 px-3 font-semibold text-blue-700">Position</th>
                    <th className="text-right py-2 px-3 font-semibold text-blue-700">Commission %</th>
                    <th className="text-left py-2 px-3 font-semibold text-blue-700">On Profit Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMISSION_STRUCTURE.map((level) => (
                    <tr key={level.rank} className="border-b border-blue-100 last:border-0">
                      <td className="py-2 px-3 font-medium text-gray-800">{level.rank}</td>
                      <td className="py-2 px-3 text-gray-600">{level.fullName}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-800">{level.percentage}%</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">of (Sale Price - Product Cost)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-blue-600 mt-3 bg-blue-100 p-2 rounded">
              💡 Commission is calculated on the <strong>profit margin</strong> (Sale Amount - Product Cost). 
              Each rank receives the specified percentage of the total profit.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dummy Product Selector */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                📦 Try with Dummy Product Data
              </label>
              <select
                value={selectedDummyProduct}
                onChange={(e) => setSelectedDummyProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Select a dummy product (auto-fills below) --</option>
                {DUMMY_PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.salePrice.toLocaleString("en-IN")} (Cost: ₹{product.costPrice.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                * Selecting a product will populate sale amount, description, and product ID. Adjust cost price to see commission changes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sale Amount (₹) *</label>
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
              <label className="block text-sm font-medium mb-1">Product Cost Price (₹) for Commission Preview</label>
              <input
                type="number"
                name="costPrice"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={handleCostPriceChange}
                placeholder="Enter product cost to calculate profit & commission"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used only for preview. Actual commission logic uses backend product cost or default margin.
              </p>
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

            {/* Live Commission Preview Card */}
            {commissionPreview && commissionPreview.profit > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Commission Preview (Based on Profit)
                </h3>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Sale Amount:</span> ₹{commissionPreview.profit + parseFloat(costPrice || 0)}</p>
                  <p><span className="font-medium">Product Cost:</span> ₹{parseFloat(costPrice || 0)}</p>
                  <p><span className="font-medium">Total Profit (Difference):</span> ₹{commissionPreview.profit.toFixed(2)}</p>
                  <div className="mt-3 pt-2 border-t border-green-200">
                    <p className="font-semibold">Commission Distribution:</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {commissionPreview.distributions.map((dist) => (
                        <div key={dist.rank} className="flex justify-between text-xs">
                          <span>{dist.rank} ({dist.percentage}%):</span>
                          <span className="font-mono">₹{dist.commissionAmount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200 flex justify-between font-semibold text-sm">
                      <span>Total Commission Payout:</span>
                      <span>₹{commissionPreview.totalCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Company / Residual Profit:</span>
                      <span>₹{commissionPreview.companyProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {commissionPreview && commissionPreview.profit <= 0 && parseFloat(costPrice) > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ No profit to distribute (Sale amount is not greater than product cost). Commission will be zero for all levels.
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Recording..." : "Record Sale"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Additional info note */}
          <div className="mt-6 text-xs text-gray-400 border-t pt-4">
            <p>✅ The actual commission is calculated on the backend using the sale amount and product's base cost from the inventory.</p>
            <p>📊 The preview above helps you understand how the profit difference is split among MLM ranks as per the PPT structure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}