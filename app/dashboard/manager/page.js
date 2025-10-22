'use client'
import { useState, useEffect, useContext } from "react";
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { Mutated, useSWRFetch } from "@/app/components/config/useswrfetch";
import ManagerProfile from "@/app/components/manager/manager";
import RootContext from "@/app/components/config/rootcontext";

export default function ManagerDashboard() {
  const [userId, setUserId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCall, setServiceCall] = useState(false);
  const { setRootContext } = useContext(RootContext);
  // ✅ Read localStorage only on client once
  useEffect(() => {
    const details = JSON.parse(localStorage.getItem('user_details') || '{}');
    if (details?.userId) setUserId(details.userId);
  }, []);

  const { data, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );
  const mutate = Mutated(userId ? `/api/employees?id=${userId}` : null)

  function GetEmployee() {
    const { data, error } = useSWRFetch("/api/employees");
    return {
      employeesData: data || [],
      employeesLoading: !error && !data,
      employeesError: error
    };
  }

  const { employeesData } = GetEmployee();

  if (error) return <Error />;
  if (isLoading || !userId) return <Loading />;

  const handleLeaveAction = async (leave, status) => {
    if (!confirm(`Are you sure you want to ${status} this leave?`)) return;
    setServiceCall(true)
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
      if (res.status) {
        setServiceCall(false)
      }
      setRootContext((prevContext) => ({
        ...prevContext,
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
      setRootContext((prevContext) => ({
        ...prevContext,
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
  // Convert employee data to attendance summary
  function getAttendanceSummary(employees) {
    return employees.map(emp => {
      // Get today's date or latest attendance entry
      const today = new Date().toISOString().slice(0, 10);
      let status = "absent"; // default

      // Flatten attendance
      const allAttendance = Object.values(emp.attendance || {}).flat();

      const todayEntry = allAttendance.find(a => a.date === today);

      if (todayEntry) {
        if (todayEntry.status) status = todayEntry.status; // approved/rejected leave
        else if (todayEntry.checkIn) status = "present";   // checked in
        else status = "absent";                            // no check-in
      }

      return {
        employeeName: emp.name,
        status,
      };
    });
  }
  const attendanceSummary = getAttendanceSummary(employeesData);
  return (
    <div className="space-y-6 px-4 md:px-8 py-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
      {serviceCall && <Loading />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- Team Leaves --- */}
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Team Leaves & Approvals
          </h2>

          {pendingLeaves.length === 0 && <p className="text-gray-500">No pending leaves</p>}

          <ul className="space-y-4">
            {pendingLeaves.map((leave) => (
              <li
                key={leave._id}
                className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{leave.employeeName}</p>
                  <p className="text-sm text-gray-600">{leave.startDate} → {leave.endDate}</p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-medium">{leave.leaveType}</span>
                  </p>
                  <p className="text-sm text-gray-600">Reason: {leave.reason}</p>
                </div>
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(leave, "approved")}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(leave, "rejected")}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Team Attendance --- */}
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Team Attendance
          </h2>
          <p className="text-gray-500 mb-4">Attendance overview and status for your team.</p>

          <div className="grid grid-cols-1 gap-3">
            {attendanceSummary.map((att, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition"
              >
                <p className="text-gray-700 font-medium">{att.employeeName}</p>
                <span
                  className={`px-2 py-1 rounded text-white font-semibold ${att.status === "present"
                    ? "bg-green-500"
                    : att.status === "absent"
                      ? "bg-red-500"
                      : att.status === "halfDay"
                        ? "bg-yellow-500"
                        : att.status === "approved"
                          ? "bg-blue-500"
                          : att.status === "rejected"
                            ? "bg-gray-500"
                            : "bg-gray-400"
                    }`}
                >
                  {att.status}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <ManagerProfile employeesData={data} />
    </div>
  );
}