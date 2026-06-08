"use client";
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { useRouter } from "next/navigation";

export default function ManagerTeam() {
  const [userId, setUserId] = useState("");
  const { rootContext } = useContext(RootContext);
  const router = useRouter();

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return "EMP";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data: managerData } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );

  const { data: employeesData, isLoading: employeesLoading, error } = useSWRFetch(
    "/api/employees"
  );

  const teamMembers = employeesData?.filter(employee =>
    employee.reportingId === userId
  ) || [];

  const logOut = () => {
    localStorage.clear();
    router.push("/");
  };

  if (error) return <Error />;
  if (employeesLoading || !userId) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        
        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            My Team
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm font-mono text-gray-400">
              {formatDateTime(new Date().toISOString(), "ddd • MMM DD, YYYY")}
            </p>
          </div>
        </header>

        {/* Team Size Card */}
        <div className="w-full md:w-1/3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 border-b-4 border-b-blue-500 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Team Size</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-semibold text-gray-900">{teamMembers.length}</h2>
              <span className="text-sm font-medium text-gray-400">members</span>
            </div>
          </div>
        </div>

        {/* My Team Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Team Roster</h2>
          </div>
          <div className="p-6">
            {teamMembers.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-12">No team members available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {teamMembers.map((member, index) => {
                  const bgColors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600'];
                  const colorClass = bgColors[index % bgColors.length];
                  
                  return (
                    <div key={member._id} className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-full ${colorClass} flex items-center justify-center font-bold text-base mb-4`}>
                        {getInitials(member.name)}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800">{member.name}</h3>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 mb-1">{member.designation || member.role?.replace('_', ' ')}</p>
                      <p className="text-[10px] text-gray-400 font-mono mb-3">{member.employeeCode}</p>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-sm"></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
