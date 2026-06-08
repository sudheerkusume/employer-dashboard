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
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, UserPlus, Calendar, AlertCircle, 
  CheckCircle2, XCircle, Edit, Trash2 
} from "lucide-react";

export default function AdminDashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
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


  if (employeesError) return <Error />;
  if (employeesLoading) return <Loading />;

  const visibleEmployees =
    currentUserRole === "super_admin"
      ? employeesData || []
      : (employeesData || []).filter((emp) => emp.role !== "admin");

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900">
      {actionLoading && <Loading />}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Employee <span className="text-orange-500">Management</span>
          </h1>
          <p className="text-gray-500 mt-1">Manage employees, track attendance, and handle requests.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditEmployeeData(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/30 transition-all"
          >
            <UserPlus size={18} />
            Add Employee
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logOut} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </div>
      </div>

      {/* Alerts / Pending Tasks */}
      <AnimatePresence>
        {(filteredLeaves.length > 0 || filteredARs.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          >
            {/* Pending Leaves */}
            {filteredLeaves.length > 0 && (
              <div className="bg-white/80 backdrop-blur-md border border-red-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-red-50/80 px-5 py-3 border-b border-red-100 flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold text-red-800">Pending Leaves</h2>
                  <span className="ml-auto text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">Manager Absent</span>
                </div>
                <div className="p-5 flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredLeaves.map((leave) => (
                    <motion.div 
                      key={leave._id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{leave.employeeName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar size={14} />
                          <span>{format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd")}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg inline-block border border-gray-100">{leave.reason}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleLeaveAction(leave, "approved")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border border-green-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => handleLeaveAction(leave, "rejected")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending ARs */}
            {filteredARs.length > 0 && (
              <div className="bg-white/80 backdrop-blur-md border border-purple-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-purple-50/80 px-5 py-3 border-b border-purple-100 flex items-center gap-2">
                  <AlertCircle className="text-purple-500" size={20} />
                  <h2 className="text-lg font-semibold text-purple-800">Pending Regularizations</h2>
                  <span className="ml-auto text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Manager Absent</span>
                </div>
                <div className="p-5 flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredARs.map((ar) => (
                    <motion.div 
                      key={ar._id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{ar.employeeName}</p>
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg inline-block border border-gray-100">{ar.reason}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleARAction(ar, "approve")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border border-green-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => handleARAction(ar, "reject")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-bold text-gray-800">All Employees</h2>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Role</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Department</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Manager</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Status</th>
                {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <UserPlus size={40} className="text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">No employees found</p>
                      <p className="text-sm">Get started by adding a new employee.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleEmployees.map((emp) => {

                  let roleColor = "bg-blue-50 text-blue-700 border-blue-200";
                  if (emp.role === "manager") roleColor = "bg-amber-50 text-amber-700 border-amber-200";
                  if (emp.role === "admin") roleColor = "bg-purple-50 text-purple-700 border-purple-200";
                  if (emp.role === "super_admin") roleColor = "bg-indigo-50 text-indigo-700 border-indigo-200";

                  return (
                    <motion.tr 
                      key={emp._id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                      className="transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${roleColor} capitalize`}>
                          {emp.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {emp.department || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">
                          {emp.reportingManager || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          Active
                        </span>
                      </td>
                      {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditEmployee(emp)} 
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                              title="Edit Employee"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEmployee(emp._id)} 
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                              title="Delete Employee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {isClient && showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => {
                setShowAddForm(false);
                setEditEmployeeData(null);
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-gray-100"
            >
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditEmployeeData(null);
                }}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors z-10"
              >
                <XCircle size={20} />
              </button>
              <div className="p-6 sm:p-8">
                <AddEmployeeForm
                  currentUserRole={currentUserRole}
                  editData={editEmployeeData}
                  onSuccess={handleFormSuccess}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}