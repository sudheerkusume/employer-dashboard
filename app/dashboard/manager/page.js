'use client';
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
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCall, setServiceCall] = useState(false);
  const { rootContext, setRootContext } = useContext(RootContext);
  const router = useRouter();

  // ✅ Read manager ID from localStorage
  useEffect(() => {
    const details = JSON.parse(localStorage.getItem("user_details") || "{}");
    if (details?.userId) setUserId(details.userId);
  }, []);

  // Fetch manager's own data (for leaves and pending requests)
  const { data: managerData, error, isLoading } = useSWRFetch(
    userId ? `/api/employees?id=${userId}` : null
  );
  const mutate = Mutated(userId ? `/api/employees?id=${userId}` : null);

  // ✅ Fetch ALL employees to get team data
  const { data: employeesData, isLoading: employeesLoading } = useSWRFetch(
    "/api/employees"
  );

  // Filter team members (employees who report to this manager)
  const teamMembers = employeesData?.filter(employee =>
    employee.reportingId === userId
  ) || [];

  if (error) return <Error />;
  if (isLoading || employeesLoading || !userId) return <Loading />;

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

      mutate();
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

      mutate();
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

  const pendingLeaves = managerData?.pendingLeaves || [];
  const pendingARs = managerData?.pendingRegularizations || [];

  const logOut = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
    router.push("/");
  };

  return (
    <div className="space-y-6 px-4 md:px-8 py-6 bg-gray-100 min-h-screen w-full">
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

      {/* Team Summary */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Team Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">Team Size</h3>
            <p className="text-2xl font-bold text-blue-600">{teamMembers.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800">Pending Leaves</h3>
            <p className="text-2xl font-bold text-yellow-600">{pendingLeaves.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800">Pending Regularizations</h3>
            <p className="text-2xl font-bold text-purple-600">{pendingARs.length}</p>
          </div>
        </div>
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
                    {formatDateTime(leave.startDate, "DD-MM-YYYY")} →{" "}
                    {formatDateTime(leave.endDate, "DD-MM-YYYY")}
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

        {/* --- Attendance Regularization Requests --- */}
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Attendance Regularization Requests
          </h2>

          {pendingARs.length === 0 && (
            <p className="text-gray-500">No pending regularization requests</p>
          )}

          <ul className="space-y-4">
            {pendingARs.map((ar) => (
              <li
                key={ar._id}
                className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{ar.employeeName}</p>
                  {/* <p className="text-sm text-gray-600">
                    Dates: {ar.date.join(", ")}
                  </p> */}
                  <p className="text-sm text-gray-600">Reason: {ar.reason}</p>
                  <p className="text-sm text-gray-600 italic text-blue-700">
                    Status: {ar.status}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleARAction(ar, "approve")}
                    className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleARAction(ar, "reject")}
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ManagerProfile employeesData={managerData} />
    </div>
  );
}