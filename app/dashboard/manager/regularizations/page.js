"use client";
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { Mutated, useSWRFetch } from "@/app/components/config/useswrfetch";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";

export default function ManagerRegularizations() {
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCall, setServiceCall] = useState(false);
  const { rootContext, setRootContext } = useContext(RootContext);

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  // Fetch Manager's own data
  const { data: managerData, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );
  
  // Fetch All Employees to construct the history of team regularizations
  const { data: employeesData, isLoading: employeesLoading } = useSWRFetch(
    "/api/employees"
  );

  const mutate = Mutated(userId ? `/api/employees?id=${userId}` : null);

  if (error) return <Error />;
  if (isLoading || employeesLoading || !userId) return <Loading />;

  const pendingARs = managerData?.pendingRegularizations || [];
  const historyARs = [
    ...(managerData?.approvedRegularizations || []),
    ...(managerData?.rejectedRegularizations || [])
  ].sort((a, b) => new Date(b.appliedOn || b.date) - new Date(a.appliedOn || a.date));

  // ✅ Handle Attendance Regularization Approve / Reject
  const handleARAction = async (ar, action) => {
    if (!confirm(`Are you sure you want to ${action} this regularization?`)) return;
    setServiceCall(true);
    setActionLoading(true);
    try {
      const res = await fetch("/api/ar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: ar._id,
          action,
          remarks: action === "approve" ? "Approved by Manager" : "Rejected by Manager",
          managerId: userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update AR");

      setRootContext((prev) => ({
        ...prev,
        toast: {
          show: true,
          dismiss: true,
          type: "success",
          title: `Regularization ${action}`,
          message: `Regularization ${action} successfully`,
        },
      }));

      // Mutate both to keep data fresh
      mutate();
      Mutated("/api/employees")();
    } catch (err) {
      setRootContext((prev) => ({
        ...prev,
        toast: {
          show: true,
          dismiss: true,
          type: "error",
          title: "Error",
          message: err.message,
        },
      }));
    } finally {
      setServiceCall(false);
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {serviceCall && <Loading />}
        
        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            Regularizations
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
            Pending Approvals ({pendingARs.length})
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
                {pendingARs.length === 0 ? (
                  <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-gray-200 rounded text-gray-300 flex items-center justify-center mb-4 font-bold text-2xl">✓</div>
                    <p className="text-sm font-medium">No pending regularizations</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Employee</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Date</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Requested Time</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Reason</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingARs.map((ar, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 text-sm font-semibold text-gray-800">
                              <div className="flex items-center gap-2">
                                {ar.employeeName}
                                <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-purple-200 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                                  {ar.status === "pendingRegularization" ? "PENDING" : ar.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-gray-600">
                              {ar.date ? formatDateTime(ar.date, "MMM DD, YYYY") : "Missing punch"}
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-blue-600 font-semibold">
                              {ar.checkIn || '--:--'} - {ar.checkOut || '--:--'}
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-500 italic max-w-sm truncate" title={ar.reason}>
                              "{ar.reason}"
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleARAction(ar, "approve")}
                                  className="bg-white border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 hover:border-emerald-200 text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleARAction(ar, "reject")}
                                  className="bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-700 hover:border-red-200 text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                {historyARs.length === 0 ? (
                  <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                    <p className="text-sm font-medium">No regularization history found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Employee</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Date</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Requested Time</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Reason</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyARs.map((ar, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 text-sm font-semibold text-gray-800">{ar.employeeName}</td>
                            <td className="py-4 px-4 text-xs font-mono text-gray-600">
                              {ar.date ? formatDateTime(ar.date, "MMM DD, YYYY") : "Missing punch"}
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-blue-600 font-semibold">
                              {ar.checkIn || '--:--'} - {ar.checkOut || '--:--'}
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-500 italic max-w-sm truncate" title={ar.reason}>
                              "{ar.reason}"
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                                ar.status === "approved" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                  : "bg-red-50 text-red-600 border-red-200"
                              }`}>
                                {ar.status}
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
