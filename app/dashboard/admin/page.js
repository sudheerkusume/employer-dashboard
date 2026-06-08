"use client";
import React, { useContext, useEffect, useState } from "react";
import AddEmployeeForm from "@/app/components/common/addemployee";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import {
  Users, UserCheck, UserX, Clock, Bell,
  Plus, CheckCircle, FileText, Download,
  Activity, Calendar, User
} from "lucide-react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import { format } from "date-fns";
import RootContext from "@/app/components/config/rootcontext";
import { useRouter } from "next/navigation";
import { Switch } from "@headlessui/react";

export default function DashboardHome() {
  const [isClient, setIsClient] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingARs, setPendingARs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active"); // "active", "inactive", "all"
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [togglingEmployeeId, setTogglingEmployeeId] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user_details");
    let userData = null;
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
        if (userData.name) setUserName(userData.name);
      } catch (e) { }
    }
    const role = userData?.role?.toLowerCase?.() || "";
    setCurrentUserRole(role);
  }, [router]);

  // Include inactive employees only if filter allows, but for pending actions we only need active ones
  const includeInactiveParam = statusFilter === "all" || statusFilter === "inactive" ? "&includeInactive=true" : "";
  const {
    data: employeesData,
    error: employeesError,
    isLoading: employeesLoading,
    mutate: mutateEmployees,
  } = useSWRFetch(`/api/employees${includeInactiveParam ? `?${includeInactiveParam.slice(1)}` : ""}`);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const res = await fetch("/api/leave/pending?all=true");
        if (res.ok) setPendingLeaves(await res.json());
      } catch (err) { }
    };

    const fetchPendingARs = async () => {
      try {
        const res = await fetch("/api/ar/pending?all=true");
        if (res.ok) setPendingARs(await res.json());
      } catch (err) { }
    };

    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      fetchPendingLeaves();
      fetchPendingARs();
    }
  }, [currentUserRole]);

  if (!isClient || employeesLoading) return <Loading />;

  // Calculate stats from real data
  const totalEmployees = employeesData ? employeesData.length : 0;
  let presentToday = 0;
  let onLeaveToday = 0;
  let lateCheckins = 0;
  let recentCheckins = [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const monthName = format(new Date(), "MMMM");

  if (employeesData) {
    employeesData.forEach(emp => {
      // Check Leaves
      const isOnLeave = (emp.leaves || []).some(leave =>
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

    // Toggle active/inactive status (soft delete / reactivate)
    const handleToggleStatus = async (employee, newStatus) => {
      const action = newStatus ? "activate" : "deactivate";
      if (!confirm(`Are you sure you want to ${action} ${employee.name}?`)) return;

      setTogglingEmployeeId(employee._id); // disable toggle for this row
      try {
        const res = await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: employee._id,
            isActive: newStatus,
          }),
        });
        if (res.ok) {
          mutateEmployees();
          setRootContext((prev) => ({
            ...prev,
            toast: {
              show: true,
              dismiss: true,
              type: "success",
              title: "Status Updated",
              message: `${employee.name} is now ${newStatus ? "active" : "inactive"}.`,
            },
          }));
        } else {
          throw new Error();
        }
      } catch (err) {
        setRootContext((prev) => ({
          ...prev,
          toast: {
            show: true,
            dismiss: true,
            type: "error",
            title: "Error",
            message: `Failed to ${action} employee.`,
          },
        }));
      } finally {
        setTogglingEmployeeId(null); // re-enable toggle
      }
    };

    const handleEditEmployee = (employee) => {
      setEditEmployeeData(employee);
      setShowAddForm(true);
    };

    const handleFormSuccess = () => {
      mutateEmployees();
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

    // Filter by role and status filter
    let visibleEmployees = employeesData || [];
    if (currentUserRole !== "super_admin") {
      visibleEmployees = visibleEmployees.filter((emp) => emp.role !== "admin");
    }
    // Additional status-based filter (if using separate endpoint, this is redundant, but safe)
    if (statusFilter === "active") {
      visibleEmployees = visibleEmployees.filter((emp) => emp.isActive !== false);
    } else if (statusFilter === "inactive") {
      visibleEmployees = visibleEmployees.filter((emp) => emp.isActive === false);
    }

    return (
      <div className="p-6 md:p-10 font-sans text-gray-900 bg-gray-50 min-h-full">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
          {/* Left Side: Greeting */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className={`${outfit.className} text-2xl md:text-[28px] font-bold tracking-tight text-gray-900 flex items-center gap-2`}>
                {getGreeting()}, {userName} <span className="text-xl">✨</span>
              </h1>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 mt-1.5">
                <Activity size={14} className="text-orange-500" />
                Workforce management is on track.
              </p>
            </div>
          </div>

          {/* Right Side: Date/Time & Profile */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Calendar size={16} className="text-orange-400" />
              <span className="font-bold text-gray-700 text-sm">
                {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
              <span className="font-bold text-sm text-orange-500">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="m-0 font-bold text-gray-900 text-sm">{userName}</p>
                <p className="m-0 text-xs font-semibold text-gray-500 capitalize">Master Access</p>
              </div>
              <div className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                <User size={20} />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">
          {currentUserRole === "super_admin" ? "Super Admin Dashboard" : "Admin Dashboard"}
        </h1>

        <div className="flex gap-4 items-center flex-wrap">
          <button
            onClick={() => {
              setEditEmployeeData(null);
              setShowAddForm(true);
            }}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded shadow"
          >
            Add Employee
          </button>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-gray-700"
          >
            <option value="active">Active Employees</option>
            <option value="inactive">Inactive Employees</option>
            <option value="all">All Employees (Active + Inactive)</option>
          </select>
        </div>

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
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */ }
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="text-orange-500" size={20} /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/admin/employees">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <Plus size={18} /> Add Employee
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/leaves">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <CheckCircle size={18} /> Approve Leave
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/payroll">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <FileText size={18} /> Generate Payroll
            </motion.button>
          </Link>
          <Link href="/dashboard/admin/reports">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm font-medium"
            >
              <Download size={18} /> Download Report
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-8">Attendance Overview</h2>
          <div className="space-y-6">
            {attendanceStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{stat.label}</span>
                  <span className="font-bold text-gray-900">{stat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-2.5 rounded-full ${stat.color}`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
  }

  {/* Month Selector */ }
  <div className="flex items-center gap-3 mt-4">
    <label className="font-medium text-gray-800">Select Month:</label>
    <input
      type="month"
      value={`${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`}
      onChange={(e) => setSelectedMonth(new Date(e.target.value))}
      className="p-2 border border-gray-300 text-gray-800 rounded-md"
    />
  </div>

  {/* Employee Table */ }
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
          <th className="py-2 px-3 border text-center">Status</th>
          {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
            <th className="py-2 px-3 border text-center">Actions</th>
          )}
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
              <td className="py-2 px-3 border text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                  {emp.isActive !== false ? "Active" : "Inactive"}
                </span>
              </td>
              {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
                <td className="py-2 px-3 border text-center whitespace-nowrap">
                  <button
                    onClick={() => handleEditEmployee(emp)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <Switch
                    checked={emp.isActive !== false}
                    onChange={() => handleToggleStatus(emp, emp.isActive === false)}
                    disabled={togglingEmployeeId === emp._id}
                    className={`${emp.isActive !== false ? "bg-green-600" : "bg-gray-400"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${emp.isActive !== false ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

    </div >
  );
}