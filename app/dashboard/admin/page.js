"use client";
import React, { useContext, useEffect, useState } from "react";
import AddEmployeeForm from "@/app/components/common/addemployee";
import { useSWRFetch, Mutated } from "@/app/components/config/useswrfetch";
import { parse, differenceInMinutes, eachDayOfInterval, startOfMonth, endOfMonth, isSunday } from "date-fns";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import RootContext from "@/app/components/config/rootcontext";
import { useRouter } from "next/navigation";

export default function AdminDashboard({ currentUserRole }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, error, isLoading, mutate } = useSWRFetch("/api/employees");
  const { rootContext, setRootContext } = useContext(RootContext);

  const holidays = [
    '2025-01-01',
    '2025-01-26',
    '2025-03-25',
    '2025-08-15',
    '2025-10-02',
    '2025-10-18',
    '2025-10-20',
    '2025-10-02',
    '2025-12-25',
  ];

  const FULL_DAY_HOURS = 8.75;
  const HALF_DAY_HOURS = 4.25;

  // Calculate working & present days
  const calculateAttendance = (attendance, monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const monthName = monthDate.toLocaleString("default", { month: "long" });

    const totalWorkingDays = monthDates.filter(d => !isSunday(d) && !holidays.includes(d.toISOString().split('T')[0])).length;

    let totalPresent = 0;
    (attendance?.[monthName] || []).forEach(item => {
      if (item.checkIn && item.checkOut) {
        const checkIn = parse(item.checkIn, "HH:mm", new Date());
        const checkOut = parse(item.checkOut, "HH:mm", new Date());
        const workedHours = differenceInMinutes(checkOut, checkIn) / 60;

        if (workedHours >= FULL_DAY_HOURS) totalPresent += 1;
        else if (workedHours >= HALF_DAY_HOURS) totalPresent += 0.5;
      } else if (item.status === "present") {
        totalPresent += 1;
      } else if (item.status === "firstHalfApproved" || item.status === "secondHalfApproved" || item.status === "halfDay") {
        totalPresent += 0.5;
      }
    });

    return { totalWorkingDays, totalPresent };
  };

  const logOut = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
    router.push("/");
  };

  // Delete employee (only super admin can do this)
  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
      if (response.ok) {
        // Refresh employee list
        mutate();
        setRootContext(prev => ({
          ...prev,
          toast: { show: true, dismiss: true, type: "success", title: "Deleted", message: "Employee removed successfully." }
        }));
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      setRootContext(prev => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "error", title: "Error", message: "Could not delete employee." }
      }));
    }
  };

  // Edit employee – you can open a modal or redirect
  const handleEditEmployee = (employee) => {
    // Example: open AddEmployeeForm in edit mode – you may need to extend AddEmployeeForm to accept an `editData` prop
    // For simplicity, we'll just show an alert.
    alert(`Edit functionality for ${employee.name} – implement as needed.`);
  };

  if (error) return <Error />;

  // Filter employees: hide admins from non-super-admin users
  const visibleEmployees = data?.filter(emp => {
    if (currentUserRole === "super_admin") return true;   // Super admin sees everyone
    return emp.role !== "admin";                         // Regular admin hides other admins
  }) || [];

  return (
    <div className="space-y-6 p-6 w-full bg-white">
      {isLoading && <Loading />}

      <div className="absolute top-4 right-4">
        <button
          onClick={logOut}
          className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800">
        {currentUserRole === "super_admin" ? "Super Admin Dashboard" : "Admin Dashboard"}
      </h1>

      {/* Add Employee – always visible for admin and super admin */}
      <button
        onClick={() => setShowAddForm(true)}
        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded shadow"
      >
        Add Employee
      </button>

      {/* Month Selector */}
      <div className="flex items-center gap-3 mt-4">
        <label className="font-medium text-gray-800">Select Month:</label>
        <input
          type="month"
          value={`${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="p-2 border border-gray-300 text-gray-800 rounded-md focus:ring-gray-500 focus:border-gray-500"
        />
      </div>

      {/* Employee Attendance Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border rounded-xl capitalize text-sm text-gray-700">
          <thead className="bg-gray-100 font-semibold text-gray-800">
            <tr>
              <th className="py-2 px-3 border">Name</th>
              <th className="py-2 px-3 border">Role</th>
              <th className="py-2 px-3 border text-center">Today Check-In</th>
              <th className="py-2 px-3 border text-center">Today Check-Out</th>
              <th className="py-2 px-3 border text-center">
                Total Working Days ({selectedMonth.toLocaleString("default", { month: "long", year: "numeric" })})
              </th>
              <th className="py-2 px-3 border text-center">
                Total Present Days ({selectedMonth.toLocaleString("default", { month: "long", year: "numeric" })})
              </th>
              {currentUserRole === "super_admin" && (
                <th className="py-2 px-3 border text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((emp, idx) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const monthData = emp.attendance?.[selectedMonth.toLocaleString("default", { month: "long" })] || [];
              const todayRecord = monthData.find((d) => d.date === todayStr);
              const { totalWorkingDays, totalPresent } = calculateAttendance(emp.attendance, selectedMonth);

              // Row background based on role
              let rowClass = "";
              let roleTextClass = "";
              if (emp.role === "manager") {
                rowClass = "bg-yellow-100 hover:bg-yellow-200";
                roleTextClass = "text-yellow-800 font-semibold";
              } else if (emp.role === "admin") {
                rowClass = "bg-purple-100 hover:bg-purple-200";
                roleTextClass = "text-purple-800 font-semibold";
              } else {
                rowClass = "bg-blue-100 hover:bg-blue-200";
                roleTextClass = "text-blue-800 font-semibold";
              }

              return (
                <tr key={idx} className={`${rowClass} border-b`}>
                  <td className="py-2 px-3 border font-medium">{emp.name}</td>
                  <td className={`py-2 px-3 border text-center ${roleTextClass}`}>{emp.role}</td>
                  <td className="py-2 px-3 border text-center">{todayRecord?.checkIn || "-"}</td>
                  <td className="py-2 px-3 border text-center">{todayRecord?.checkOut || "-"}</td>
                  <td className="py-2 px-3 border text-center font-semibold">{totalWorkingDays}</td>
                  <td className="py-2 px-3 border text-center font-semibold text-green-700">{totalPresent}</td>
                  {currentUserRole === "super_admin" && (
                    <td className="py-2 px-3 border text-center whitespace-nowrap">
                      <button
                        onClick={() => handleEditEmployee(emp)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isClient && showAddForm && (
        <div className="fixed w-full inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full sm:w-[55%] max-h-[90vh] overflow-y-auto p-4 relative">
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