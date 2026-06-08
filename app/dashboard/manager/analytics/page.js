"use client";
import { useState, useEffect } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { motion } from "framer-motion";

export default function ManagerAnalytics() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data: managerData, error: managerError, isLoading: managerLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );

  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useSWRFetch(
    "/api/employees"
  );

  if (managerError || employeesError) return <Error />;
  if (managerLoading || employeesLoading || !userId) return <Loading />;

  // Get Team Members
  const teamMembers = employeesData?.filter(emp => emp.reportingId === userId) || [];
  
  const pendingLeaves = managerData?.pendingLeaves?.length || 0;
  const pendingARs = managerData?.pendingRegularizations?.length || 0;
  const totalPending = pendingLeaves + pendingARs;

  // Mocked analytics data based on team size
  const attendanceRate = teamMembers.length > 0 ? 94 : 0; // 94%
  const avgHours = teamMembers.length > 0 ? 8.4 : 0;

  // Mocked Leave Utilization
  const totalLeavesAllocated = teamMembers.length * 24; // e.g. 24 leaves per person
  const leavesTaken = teamMembers.length * 5; // pseudo random usage
  const leavePercentage = totalLeavesAllocated > 0 ? Math.round((leavesTaken / totalLeavesAllocated) * 100) : 0;

  // Variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        
        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            Team Analytics
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm font-mono text-gray-400">
              {formatDateTime(new Date().toISOString(), "ddd • MMM DD, YYYY")}
            </p>
          </div>
        </header>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* 1. High-Level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Attendance Rate</p>
              <div className="flex items-end gap-3 relative z-10">
                <h2 className="text-4xl font-semibold text-gray-900">{attendanceRate}%</h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1 flex items-center">↑ 2.4%</span>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Avg Daily Hours</p>
              <div className="flex items-end gap-3 relative z-10">
                <h2 className="text-4xl font-semibold text-gray-900">{avgHours}</h2>
                <span className="text-sm font-medium text-gray-500 mb-1">hrs / day</span>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Pending Actions</p>
              <div className="flex items-end gap-3 relative z-10">
                <h2 className="text-4xl font-semibold text-gray-900">{totalPending}</h2>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md mb-1 flex items-center">Tasks</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. Team Leave Utilization (Progress Bars) */}
            <motion.div variants={item} className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-800">Leave Utilization (YTD)</h2>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border border-gray-200">Across {teamMembers.length} Members</span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center gap-8">
                
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-semibold text-gray-700">Total Leave Quota</p>
                    <p className="text-xs font-mono text-gray-500"><span className="font-bold text-gray-900">{leavesTaken}</span> / {totalLeavesAllocated} days</p>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${leavePercentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-indigo-500 rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Breakdown Sick */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Sick Leave</p>
                      <p className="text-[10px] font-mono text-gray-400">40%</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-amber-400 rounded-full"></motion.div>
                    </div>
                  </div>

                  {/* Breakdown Casual */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Casual Leave</p>
                      <p className="text-[10px] font-mono text-gray-400">60%</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-emerald-400 rounded-full"></motion.div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* 3. Top Performers / Reliable */}
            <motion.div variants={item} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Perfect Attendance (Week)</h2>
              </div>
              <div className="p-2 flex-1">
                {teamMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">No team data</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {teamMembers.slice(0, 4).map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors rounded-lg mx-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{member.designation || member.role}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <span className="text-[10px]">🔥</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
