"use client";
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { Mutated, useSWRFetch } from "@/app/components/config/useswrfetch";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";

export default function ManagerLeaves() {
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCall, setServiceCall] = useState(false);
  const { rootContext, setRootContext } = useContext(RootContext);

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  // Fetch Manager's own data (for the `pendingLeaves` quick access)
  const { data: managerData, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );
  
  // Fetch All Employees to construct the history of team leaves
  const { data: employeesData, isLoading: employeesLoading } = useSWRFetch(
    "/api/employees"
  );

  const mutate = Mutated(userId ? `/api/employees?id=${userId}` : null);

  if (error) return <Error />;
  if (isLoading || employeesLoading || !userId) return <Loading />;

  const pendingLeaves = managerData?.pendingLeaves || [];
  const historyLeaves = [
    ...(managerData?.approvedLeaves || []),
    ...(managerData?.rejectedLeaves || [])
  ].sort((a, b) => new Date(b.appliedOn || b.startDate || b.createdAt) - new Date(a.appliedOn || a.startDate || a.createdAt));

  // ✅ Handle Leave Approve / Reject
  const handleLeaveAction = async (leave, status) => {
    if (!confirm(`Are you sure you want to ${status} this leave?`)) return;
    setServiceCall(true);
    setActionLoading(true);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: userId,
          employeeId: leave.employeeId,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Something went wrong");

      setRootContext((prev) => ({
        ...prev,
        toast: {
          show: true,
          dismiss: true,
          type: "success",
          title: `Leave ${status}`,
          message: `Leave ${status} successfully`,
        },
      }));

      // Mutate both endpoints to keep everything fresh
      mutate();
      Mutated("/api/employees")();
    } catch (err) {
      setRootContext((prev) => ({
        ...prev,
        toast: {
          show: true,
          dismiss: true,
          type: "error",
          title: "Failed",
          message: `${err.message}`,
        },
      }));
    } finally {
      setActionLoading(false);
      setServiceCall(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {serviceCall && <Loading />}
        
        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            Leave Requests
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm font-mono text-gray-400">
              {formatDateTime(new Date().toISOString(), "ddd • MMM DD, YYYY")}
            </p>
          </div>
        </header>

        {/* Custom Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "pending" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Pending Approvals ({pendingLeaves.length})
            {activeTab === "pending" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gray-900 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "history" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            History
            {activeTab === "history" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gray-900 rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            
            {activeTab === "pending" && (
              <>
                {pendingLeaves.length === 0 ? (
                  <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-gray-200 rounded text-gray-300 flex items-center justify-center mb-4 font-bold text-2xl">✓</div>
                    <p className="text-sm font-medium">No pending leave requests</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingLeaves.map((leave, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-5 flex flex-col group hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-gray-900">{leave.employeeName}</p>
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-amber-200">{leave.leaveType}</span>
                        </div>
                        <p className="text-xs font-mono text-gray-500 mb-3 bg-white p-2 rounded border border-gray-100">
                          <span className="font-semibold text-gray-700">{formatDateTime(leave.startDate, "MMM DD, YYYY")}</span> 
                          <span className="mx-2 text-gray-400">→</span> 
                          <span className="font-semibold text-gray-700">{formatDateTime(leave.endDate, "MMM DD, YYYY")}</span>
                        </p>
                        <p className="text-sm text-gray-600 italic mb-5 bg-white p-3 rounded border border-gray-100 flex-1">"{leave.reason}"</p>
                        
                        <div className="flex gap-2 mt-auto">
                          <button
                            disabled={actionLoading}
                            onClick={() => handleLeaveAction(leave, "approved")}
                            className="flex-1 bg-white border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 hover:border-emerald-200 text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleLeaveAction(leave, "rejected")}
                            className="flex-1 bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-700 hover:border-red-200 text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                {historyLeaves.length === 0 ? (
                  <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <p className="text-sm font-medium">No leave history found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Employee</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Leave Type</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Duration</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Reason</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyLeaves.map((leave, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 text-sm font-semibold text-gray-800">{leave.employeeName}</td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded bg-white">
                                {leave.leaveType}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-gray-600">
                              {formatDateTime(leave.startDate, "MMM DD, YYYY")} - {formatDateTime(leave.endDate, "MMM DD, YYYY")}
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-500 italic max-w-xs truncate" title={leave.reason}>
                              "{leave.reason}"
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                                leave.status === "approved" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                  : "bg-red-50 text-red-600 border-red-200"
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
