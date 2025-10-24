'use client';
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { Mutated, useSWRFetch } from "@/app/components/config/useswrfetch";
import ManagerProfile from "@/app/components/manager/manager";
import RootContext from "@/app/components/config/rootcontext";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { parse, differenceInMinutes } from "date-fns";


export default function ManagerDashboard() {
  const [userId, setUserId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCall, setServiceCall] = useState(false);
  const { rootContext, setRootContext } = useContext(RootContext);

  // ✅ Read localStorage only on client once
  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );
  const mutate = Mutated(userId ? `/api/employees?id=${userId}` : null);

  function GetEmployee() {
    const { data, error } = useSWRFetch("/api/employees");
    return {
      employeesData: data || [],
      employeesLoading: !error && !data,
      employeesError: error,
    };
  }

  const { employeesData } = GetEmployee();

  if (error) return <Error />;
  if (isLoading || !userId) return <Loading />;

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
      if (res.status) setServiceCall(false);

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

      mutate(); // Refresh SWR data
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
    }
  };

  const pendingLeaves = data?.pendingLeaves || [];

  const logOut = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
  };

  return (
    <div className="space-y-6 px-4 md:px-8 py-6 bg-gray-100 min-h-screen">      
      {serviceCall && <Loading />}
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
        <button
          onClick={logOut}
          className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- Team Leaves --- */}
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Team Leaves & Approvals
          </h2>

          {pendingLeaves.length === 0 && (
            <p className="text-gray-500">No pending leaves</p>
          )}

          <ul className="space-y-4">
            {pendingLeaves.map((leave) => (
              <li
                key={leave._id}
                className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {leave.employeeName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(leave.startDate, "DD-MM-YYYY")} → {formatDateTime(leave.endDate, "DD-MM-YYYY")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-medium">{leave.leaveType}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Reason: {leave.reason}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(leave, "approved")}
                    className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(leave, "rejected")}
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Team Attendance (Current Month Overview) --- */}
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Team Attendance - {new Date().toLocaleString("en-US", { month: "long" })}
          </h2>
          <p className="text-gray-500 mb-4">
            Today's check-in & check-out and monthly presence summary.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm text-left text-gray-700 rounded-xl">
              <thead className="bg-gray-100 text-gray-800 font-semibold">
                <tr>
                  <th className="py-2 px-3 border">Employee</th>
                  <th className="py-2 px-3 border text-center">Check-In (Today)</th>
                  <th className="py-2 px-3 border text-center">Check-Out (Today)</th>
                  <th className="py-2 px-3 border text-center">Present Days</th>
                  <th className="py-2 px-3 border text-center">Working Days</th>
                </tr>
              </thead>
              <tbody>
                {employeesData.map((emp, idx) => {
                  const attendance = emp.attendance || {};
                  const today = new Date();
                  const currentMonthIndex = today.getMonth();
                  const currentYear = today.getFullYear();
                  const monthName = today.toLocaleString("en-US", { month: "long" });

                  const monthData = attendance[monthName] || [];

                  // Define holidays for this month
                  const holidays = [`${currentYear}-10-02`, `${currentYear}-10-15`];

                  const FULL_DAY_HOURS = 8.75;
                  const HALF_DAY_HOURS = 4.25;

                  // Total working days excluding Sundays & holidays
                  const start = new Date(currentYear, currentMonthIndex, 1);
                  const end = new Date(currentYear, currentMonthIndex + 1, 0);
                  const totalWorkingDays = Array.from(
                    { length: end.getDate() },
                    (_, i) => new Date(currentYear, currentMonthIndex, i + 1)
                  ).filter(
                    (d) => d.getDay() !== 0 && !holidays.includes(d.toISOString().split("T")[0])
                  ).length;

                  // Calculate employee worked days
                  let workedDays = 0;
                  monthData.forEach((d) => {
                    if (d.checkIn && d.checkOut) {
                      const checkInTime = parse(d.checkIn, "HH:mm", new Date());
                      const checkOutTime = parse(d.checkOut, "HH:mm", new Date());
                      const minutesWorked = differenceInMinutes(checkOutTime, checkInTime);
                      const hoursWorked = minutesWorked / 60;

                      if (hoursWorked >= FULL_DAY_HOURS) workedDays += 1;
                      else if (hoursWorked >= HALF_DAY_HOURS) workedDays += 0.5;
                    } else if (d.status === "firstHalfApproved" || d.status === "secondHalfApproved") {
                      workedDays += 0.5;
                    } else if (d.status === "present") {
                      workedDays += 1;
                    }
                  });

                  // Today's attendance
                  const todayStr = today.toISOString().split("T")[0];
                  const todayEntry = monthData.find((d) => d.date === todayStr);
                  const checkIn = todayEntry?.checkIn || "-";
                  const checkOut = todayEntry?.checkOut || "-";

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-3 border font-medium">{emp.name}</td>
                      <td className="py-2 px-3 border text-center text-green-700">{checkIn}</td>
                      <td className="py-2 px-3 border text-center text-blue-700">{checkOut}</td>
                      <td className="py-2 px-3 border text-center text-green-600 font-semibold">{workedDays}</td>
                      <td className="py-2 px-3 border text-center font-semibold text-gray-800">{totalWorkingDays}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <ManagerProfile employeesData={data} />
    </div>
  );
}