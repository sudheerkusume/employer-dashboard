"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import { format, differenceInDays } from "date-fns";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Check, X, Calendar as CalendarIcon, Clock, AlertCircle, Inbox, List, FileText } from "lucide-react";
import RootContext from "@/app/components/config/rootcontext";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export default function AdminLeavesPage() {
  const [viewMode, setViewMode] = useState("pending"); // "pending" or "history"
  const [actionLoading, setActionLoading] = useState(null); // id of leave being processed

  const { rootContext } = useContext(RootContext);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user_details");
    let userData = null;
    if (storedUser) {
      try { userData = JSON.parse(storedUser); } catch (e) { }
    }
    const role = userData?.role?.toLowerCase?.() || "";
    setCurrentUserRole(role);
  }, [router]);

  const {
    data: employeesData,
    error: employeesError,
    isLoading: employeesLoading,
  } = useSWRFetch("/api/employees");

  // Aggregate Leaves
  const { pendingLeaves, historyLeaves } = useMemo(() => {
    if (!employeesData) return { pendingLeaves: [], historyLeaves: [] };
    
    let pending = [];
    let history = [];

    employeesData.forEach(emp => {
      // Admin sees everyone's leaves unless restricted
      if (currentUserRole !== "super_admin" && emp.role === "admin") return;

      const leaves = emp.leaves || [];
      leaves.forEach((leave, idx) => {
        // give each leave a unique key based on emp id and index
        const leaveObj = { ...leave, empId: emp._id, empName: leave.employeeName || emp.name, empRole: leave.employeeRole || emp.role, originalIndex: idx, leaveId: `${emp._id}-${idx}` };
        
        if (leave.status === "pending") {
          pending.push(leaveObj);
        } else {
          history.push(leaveObj);
        }
      });
    });

    // Sort by most recent start date
    pending.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    history.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return { pendingLeaves: pending, historyLeaves: history };
  }, [employeesData, currentUserRole]);

  const handleStatusChange = async (empId, originalIndex, newStatus, leaveId) => {
    setActionLoading(leaveId);
    try {
      // Find the employee
      const emp = employeesData.find(e => e._id === empId);
      if (!emp) throw new Error("Employee not found");

      // Clone leaves and update
      const updatedLeaves = [...(emp.leaves || [])];
      if (updatedLeaves[originalIndex]) {
        updatedLeaves[originalIndex].status = newStatus;
      }

      // Send PUT request
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: empId, leaves: updatedLeaves })
      });

      if (!res.ok) throw new Error(`Failed to update leave request`);
      
      window.location.reload(); // Quick refresh to see changes
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (employeesError) return <Error />;
  if (employeesLoading) return <Loading />;

  // Helper Initials
  const getInitials = (name) => {
    if (!name) return "E";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getLeaveColor = (type) => {
    switch((type || "").toLowerCase()) {
      case "sick": return "bg-rose-50 text-rose-700 border-rose-200";
      case "casual": return "bg-blue-50 text-blue-700 border-blue-200";
      case "earned": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch((status || "").toLowerCase()) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10 font-sans text-gray-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className={`${outfit.className} text-3xl md:text-[32px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
            Leave <span className="text-orange-500">Center</span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Review, approve, and track employee time-off requests.</p>
        </div>
        
        {/* Toggle View */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setViewMode("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "pending" ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Inbox size={16} /> Pending ({pendingLeaves.length})
          </button>
          <button 
            onClick={() => setViewMode("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "history" ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List size={16} /> History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "pending" ? (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {pendingLeaves.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">All Caught Up!</h3>
                <p className="text-gray-500 font-medium">There are no pending leave requests to review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingLeaves.map((leave) => {
                  const days = Math.max(1, differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1);
                  return (
                    <motion.div 
                      key={leave.leaveId}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4 relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg border border-gray-300 shadow-inner">
                            {getInitials(leave.empName)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{leave.empName}</h4>
                            <p className="text-xs text-gray-500 font-medium capitalize">{leave.empRole.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLeaveColor(leave.type)} capitalize`}>
                          {leave.type || "Leave"}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <CalendarIcon size={14} className="text-gray-400" />
                            <span className="text-sm font-bold">{leave.startDate ? format(new Date(leave.startDate), "MMM dd") : "N/A"}</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span className="text-sm font-bold">{leave.endDate ? format(new Date(leave.endDate), "MMM dd") : "N/A"}</span>
                          </div>
                          <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600 shadow-sm">
                            {days} Day{days > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText size={12} /> Reason
                          </p>
                          <p className="text-sm font-medium text-gray-700 line-clamp-2" title={leave.reason}>{leave.reason || "No reason provided."}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-2">
                        <button 
                          onClick={() => handleStatusChange(leave.empId, leave.originalIndex, "rejected", leave.leaveId)}
                          disabled={actionLoading === leave.leaveId}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50"
                        >
                          <X size={16} /> Reject
                        </button>
                        <button 
                          onClick={() => handleStatusChange(leave.empId, leave.originalIndex, "approved", leave.leaveId)}
                          disabled={actionLoading === leave.leaveId}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 shadow-sm shadow-orange-200 hover:bg-orange-600 hover:shadow transition-all disabled:opacity-50"
                        >
                          <Check size={16} /> Approve
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Employee</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Leave Type</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Dates</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider">Reason</th>
                    <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FileText size={40} className="text-gray-300 mb-3" />
                          <p className="text-base font-bold text-gray-900">No history found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historyLeaves.map(leave => (
                      <motion.tr 
                        key={leave.leaveId}
                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                        className="transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                              {getInitials(leave.empName)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{leave.empName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getLeaveColor(leave.type)} capitalize`}>
                            {leave.type || "Leave"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">
                            {leave.startDate ? format(new Date(leave.startDate), "MMM dd, yyyy") : "N/A"} 
                            <span className="text-gray-400 mx-1">to</span> 
                            {leave.endDate ? format(new Date(leave.endDate), "MMM dd, yyyy") : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-medium truncate max-w-[200px] inline-block" title={leave.reason}>
                            {leave.reason || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(leave.status)} capitalize`}>
                            {leave.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
