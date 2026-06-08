"use client";
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { Mutated, useSWRFetch } from "@/app/components/config/useswrfetch";
import ManagerProfile from "@/app/components/manager/manager";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const [userId, setUserId] = useState("");
  const { rootContext, setRootContext } = useContext(RootContext);
  const router = useRouter();

  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data: managerData, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );

  const { data: employeesData, isLoading: employeesLoading } = useSWRFetch(
    "/api/employees"
  );

  if (error) return <Error />;
  if (isLoading || employeesLoading || !userId) return <Loading />;

  const teamMembers = employeesData?.filter(emp => emp.reportingId === userId) || [];
  const pendingLeaves = managerData?.pendingLeaves || [];
  const pendingARs = managerData?.pendingRegularizations || [];

  const logOut = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
    router.push("/");
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return "EMP";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {/* Minimalist Header */}
        <header className="flex justify-between items-center pb-2 border-b border-gray-200/60 mb-6">
          <h1 className="text-xl font-medium text-gray-800 tracking-tight">
            Good morning, {managerData?.name?.split(' ')[0] || "Manager"}
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm font-mono text-gray-400">
              {formatDateTime(new Date().toISOString(), "ddd • MMM DD, YYYY")}
            </p>
          </div>
        </header>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Size Card */}
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

          {/* Pending Leaves Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 border-b-4 border-b-amber-400 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pending Leaves</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-semibold text-gray-900">{pendingLeaves.length}</h2>
              <span className="text-sm font-medium text-gray-400">requests</span>
            </div>
          </div>

          {/* Regularizations Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 border-b-4 border-b-purple-500 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Regularizations</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-semibold text-gray-900">{pendingARs.length}</h2>
              <span className="text-sm font-medium text-gray-400">pending</span>
            </div>
          </div>
        </div>

        {/* Manager Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 w-full">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
              {getInitials(managerData?.name)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{managerData?.name || "Manager Profile"}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-medium text-gray-400">
                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> {managerData?.designation || "Engineering"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {managerData?.location || "Hyderabad"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg> {managerData?.employeeCode || "EMP-XXXX"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Present today
            </span>
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
              L3 Manager
            </span>
          </div>
        </div>

        {/* --- CRITICAL: DO NOT REMOVE THIS MANAGER PROFILE --- */}
        <div className="pt-10 pb-6 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Profile Settings</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <ManagerProfile employeesData={managerData} />
        </div>
        {/* ---------------------------------------------------- */}

      </div>
    </div>
  );
}