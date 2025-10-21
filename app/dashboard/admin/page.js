"use client";
import AddEmployeeForm from "@/app/components/common/addemployee";
import React, { useState } from "react";

export default function AdminDashboard({ currentUserRole }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {/* Add Employee Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow"
      >
        Add Employee
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-white rounded shadow">Manage Users (use API /dashboard/admin UI)</div>
        <div className="p-4 bg-white rounded shadow">Manage Holidays</div>
        <div className="p-4 bg-white rounded shadow">View Attendance Summary</div>
        <div className="p-4 bg-white rounded shadow">View All Leaves</div>
      </div>

      {/* Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold"
            >
              &times;
            </button>
            <AddEmployeeForm currentUserRole={currentUserRole} />
          </div>
        </div>
      )}
    </div>
  );
}
