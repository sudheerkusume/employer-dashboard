"use client";
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";

export default function ManagerAttendance() {
  const [userId, setUserId] = useState("");
  const { rootContext } = useContext(RootContext);

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data: employeesData, isLoading: employeesLoading, error } = useSWRFetch(
    "/api/employees"
  );

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return "EMP";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (error) return <Error />;
  if (employeesLoading || !userId) return <Loading />;

  // Get Team Members
  const teamMembers = employeesData?.filter(emp => emp.reportingId === userId) || [];

  // Determine attendance statuses for today dynamically from real data
  const todayDateStr = new Date().toISOString().split('T')[0];
  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  const teamAttendance = teamMembers.map(emp => {
    // Check if on leave
    const isOnLeave = (emp.leaveRequests || []).some(lr => 
      lr.status === "approved" && 
      new Date(lr.startDate) <= new Date() && 
      new Date(lr.endDate) >= new Date()
    );

    // Get today's attendance record
    const monthData = emp.attendance?.[currentMonthName] || [];
    const todayRecord = monthData.find(a => a.date === todayDateStr);

    let finalStatus = "Absent";
    if (isOnLeave) {
      finalStatus = "On Leave";
    } else if (todayRecord) {
      // Could be 'Checked In', 'presentLate', 'earlyOut', 'present'
      if (todayRecord.status?.toLowerCase().includes("absent")) {
        finalStatus = "Absent";
      } else {
        finalStatus = todayRecord.status === "Checked In" ? "Present" : todayRecord.status;
        // Clean up camelCase strings
        finalStatus = finalStatus.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      }
    }

    return {
      ...emp,
      status: finalStatus,
      punchIn: todayRecord?.checkIn || "--:--",
      punchOut: todayRecord?.checkOut || "--:--"
    };
  });

  const presentCount = teamAttendance.filter(t => t.status !== "Absent" && t.status !== "On Leave").length;
  const leaveCount = teamAttendance.filter(t => t.status === "On Leave").length;
  const absentCount = teamAttendance.filter(t => t.status === "Absent").length;

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        
        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            Daily Attendance
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              Today: {formatDateTime(new Date().toISOString(), "ddd, MMM DD, YYYY")}
            </p>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Team</p>
            <h2 className="text-3xl font-semibold text-gray-900">{teamMembers.length}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
            <h2 className="text-3xl font-semibold text-gray-900">{presentCount}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-500">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1">On Leave</p>
            <h2 className="text-3xl font-semibold text-gray-900">{leaveCount}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-red-500">
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1">Absent</p>
            <h2 className="text-3xl font-semibold text-gray-900">{absentCount}</h2>
          </div>
        </div>

        {/* Team Attendance Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="text-sm font-semibold text-gray-800">Team Status</h2>
            <button className="text-[11px] font-bold bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100">
              Download Report
            </button>
          </div>
          
          <div className="p-0">
            {teamAttendance.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <p className="text-sm font-medium">No team members found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Punch In</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Punch Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamAttendance.map((emp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                            (emp.status?.includes("Present") || emp.status === "Checked In") ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                            emp.status?.includes("Leave") ? "bg-amber-50 text-amber-600 border-amber-200" :
                            "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-600">{emp.punchIn}</td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-400">{emp.punchOut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
