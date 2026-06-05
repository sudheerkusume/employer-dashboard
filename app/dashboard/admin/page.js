"use client";
import React, { useContext, useEffect, useState } from "react";
import AddEmployeeForm from "@/app/components/common/addemployee";
import { useSWRFetch, Mutated } from "@/app/components/config/useswrfetch";
import {
  parse,
  differenceInMinutes,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSunday,
  format,
} from "date-fns";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import RootContext from "@/app/components/config/rootcontext";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editEmployeeData, setEditEmployeeData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingARs, setPendingARs] = useState([]);
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");
    let userData = null;

    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (e) {
        console.error("Invalid JSON in localStorage", e);
        localStorage.removeItem("user_details");
      }
    }

    const role = userData?.role?.toLowerCase?.() || "";
    setCurrentUserRole(role)
  }, [router]);


  const {
    data: employeesData,
    error: employeesError,
    isLoading: employeesLoading,
    mutate: mutateEmployees,
  } = useSWRFetch("/api/employees");

  const fetchPendingLeaves = async () => {
    try {
      const res = await fetch("/api/leave/pending?all=true");
      const data = await res.json();
      if (res.ok) setPendingLeaves(data);
    } catch (err) {
      console.error("Failed to fetch pending leaves", err);
    }
  };

  const fetchPendingARs = async () => {
    try {
      const res = await fetch("/api/ar/pending?all=true");
      const data = await res.json();
      if (res.ok) setPendingARs(data);
    } catch (err) {
      console.error("Failed to fetch pending ARs", err);
    }
  };

  useEffect(() => {
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      fetchPendingLeaves();
      fetchPendingARs();
    }
  }, [currentUserRole]);

  const isManagerAbsentToday = (managerId, employeesList) => {
    const manager = employeesList?.find((emp) => emp.userId === managerId || emp._id === managerId);
    if (!manager) return false;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const monthName = format(new Date(), "MMMM");
    const attendanceRecord = manager.attendance?.[monthName]?.find(
      (record) => record.date === todayStr
    );
    if (!attendanceRecord) return true;
    if (attendanceRecord.status === "absent") return true;
    if (!attendanceRecord.checkIn && !attendanceRecord.checkOut) return true;
    const managerLeaves = manager.leaves || [];
    const isOnLeave = managerLeaves.some(
      (leave) =>
        leave.status === "approved" &&
        new Date(leave.startDate) <= new Date() &&
        new Date(leave.endDate) >= new Date()
    );
    return isOnLeave;
  };

  const filteredLeaves = pendingLeaves.filter((leave) => {
    const managerId = leave.reportingManagerId;
    return isManagerAbsentToday(managerId, employeesData);
  });

  const filteredARs = pendingARs.filter((ar) => {
    const managerId = ar.reportingManagerId;
    return isManagerAbsentToday(managerId, employeesData);
  });

  const handleLeaveAction = async (leave, status) => {
    if (!confirm(`Are you sure you want to ${status} this leave?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: rootContext.user?.userId,
          employeeId: leave.employeeId,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setRootContext((prev) => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "success", title: `Leave ${status}`, message: `Leave ${status} successfully` },
      }));
      fetchPendingLeaves();
    } catch (err) {
      setRootContext((prev) => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "error", title: "Failed", message: err.message },
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleARAction = async (ar, action) => {
    if (!confirm(`Are you sure you want to ${action} this regularization?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/ar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: ar._id,
          action,
          remarks: `${action} by Admin`,
          adminId: rootContext.user?.userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRootContext((prev) => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "success", title: `Regularization ${action}`, message: `Regularization ${action} successfully` },
      }));
      fetchPendingARs();
    } catch (err) {
      setRootContext((prev) => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "error", title: "Error", message: err.message },
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm("Delete employee? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/employees?id=${employeeId}`, { method: "DELETE" });
      if (res.ok) {
        mutateEmployees();
        setRootContext((prev) => ({
          ...prev,
          toast: { show: true, dismiss: true, type: "success", title: "Deleted", message: "Employee removed" },
        }));
      } else throw new Error();
    } catch (err) {
      setRootContext((prev) => ({
        ...prev,
        toast: { show: true, dismiss: true, type: "error", title: "Error", message: "Could not delete employee" },
      }));
    }
  };

  const handleEditEmployee = (employee) => {
    setEditEmployeeData(employee);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    mutateEmployees();   // refresh employee list
    setShowAddForm(false);
    setEditEmployeeData(null);
  };

  const logOut = () => {
    localStorage.clear();
    setRootContext((prev) => ({ ...prev, authenticated: false }));
    router.push("/");
  };

  const calculateAttendance = (attendance, monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const holidays = ["2025-01-01", "2025-01-26", "2025-03-25", "2025-08-15", "2025-10-02", "2025-10-18", "2025-10-20", "2025-12-25"];
    const totalWorkingDays = monthDates.filter(
      (d) => !isSunday(d) && !holidays.includes(format(d, "yyyy-MM-dd"))
    ).length;
    const monthName = monthDate.toLocaleString("default", { month: "long" });
    let totalPresent = 0;
    (attendance?.[monthName] || []).forEach((item) => {
      if (item.checkIn && item.checkOut) {
        const checkIn = parse(item.checkIn, "HH:mm", new Date());
        const checkOut = parse(item.checkOut, "HH:mm", new Date());
        const workedHours = differenceInMinutes(checkOut, checkIn) / 60;
        if (workedHours >= 8.75) totalPresent += 1;
        else if (workedHours >= 4.25) totalPresent += 0.5;
      } else if (item.status === "present") totalPresent += 1;
      else if (["firstHalfApproved", "secondHalfApproved", "halfDay"].includes(item.status)) totalPresent += 0.5;
    });
    return { totalWorkingDays, totalPresent };
  };

  if (employeesError) return <Error />;
  if (employeesLoading) return <Loading />;

  const visibleEmployees =
    currentUserRole === "super_admin"
      ? employeesData || []
      : (employeesData || []).filter((emp) => emp.role !== "admin");

  return (
    <div className="space-y-6 p-6 w-full bg-white min-h-screen">
      {actionLoading && <Loading />}
      <div className="absolute top-4 right-4">
        <button onClick={logOut} className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700">
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800">
        {currentUserRole === "super_admin" ? "Super Admin Dashboard" : "Admin Dashboard"}
      </h1>

      <button
        onClick={() => {
          setEditEmployeeData(null);
          setShowAddForm(true);
        }}
        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded shadow"
      >
        Add Employee
      </button>

      {/* Pending Leaves (Manager absent) */}
      {filteredLeaves.length > 0 && (
        <div className="mt-8 p-4 border rounded-xl bg-red-50">
          <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Pending Leaves – Manager is Absent</h2>
          <div className="space-y-3">
            {filteredLeaves.map((leave) => (
              <div key={leave._id} className="p-3 bg-white rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{leave.employeeName}</p>
                  <p className="text-sm">
                    {format(new Date(leave.startDate), "dd MMM")} → {format(new Date(leave.endDate), "dd MMM")}
                  </p>
                  <p className="text-sm text-gray-600">{leave.reason}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleLeaveAction(leave, "approved")} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={() => handleLeaveAction(leave, "rejected")} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending AR (Manager absent) */}
      {filteredARs.length > 0 && (
        <div className="mt-8 p-4 border rounded-xl bg-purple-50">
          <h2 className="text-xl font-bold text-purple-800 mb-4">⚠️ Pending Regularizations – Manager is Absent</h2>
          <div className="space-y-3">
            {filteredARs.map((ar) => (
              <div key={ar._id} className="p-3 bg-white rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{ar.employeeName}</p>
                  <p className="text-sm text-gray-600">Reason: {ar.reason}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleARAction(ar, "approve")} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={() => handleARAction(ar, "reject")} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center gap-3 mt-4">
        <label className="font-medium text-gray-800">Select Month:</label>
        <input
          type="month"
          value={`${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="p-2 border border-gray-300 text-gray-800 rounded-md"
        />
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border rounded-xl text-sm text-gray-700">
          <thead className="bg-gray-100 font-semibold text-gray-800">
            <tr>
              <th className="py-2 px-3 border">Name</th>
              <th className="py-2 px-3 border">Role</th>
              <th className="py-2 px-3 border text-center">Today Check-In</th>
              <th className="py-2 px-3 border text-center">Today Check-Out</th>
              <th className="py-2 px-3 border text-center">Working Days</th>
              <th className="py-2 px-3 border text-center">Present Days</th>
              {(currentUserRole === "super_admin" || currentUserRole === "admin") && <th className="py-2 px-3 border text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((emp) => {
              const todayStr = format(new Date(), "yyyy-MM-dd");
              const monthName = selectedMonth.toLocaleString("default", { month: "long" });
              const monthData = emp.attendance?.[monthName] || [];
              const todayRecord = monthData.find((d) => d.date === todayStr);
              const { totalWorkingDays, totalPresent } = calculateAttendance(emp.attendance, selectedMonth);

              let rowClass = "bg-blue-100 hover:bg-blue-200";
              if (emp.role === "manager") rowClass = "bg-yellow-100 hover:bg-yellow-200";
              if (emp.role === "admin") rowClass = "bg-purple-100 hover:bg-purple-200";

              return (
                <tr key={emp._id} className={`${rowClass} border-b`}>
                  <td className="py-2 px-3 border font-medium">{emp.name}</td>
                  <td className="py-2 px-3 border text-center capitalize">{emp.role}</td>
                  <td className="py-2 px-3 border text-center">{todayRecord?.checkIn || "-"}</td>
                  <td className="py-2 px-3 border text-center">{todayRecord?.checkOut || "-"}</td>
                  <td className="py-2 px-3 border text-center">{totalWorkingDays}</td>
                  <td className="py-2 px-3 border text-center text-green-700 font-semibold">{totalPresent}</td>
                  {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
                    <td className="py-2 px-3 border text-center whitespace-nowrap">
                      <button onClick={() => handleEditEmployee(emp)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                      <button onClick={() => handleDeleteEmployee(emp._id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Employee Modal */}
      {isClient && showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full sm:w-[55%] max-h-[90vh] overflow-y-auto p-4 relative">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditEmployeeData(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold text-xl"
            >
              &times;
            </button>
            <AddEmployeeForm
              currentUserRole={currentUserRole}
              editData={editEmployeeData}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}