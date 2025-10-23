'use client';
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

  // ✅ Helper to convert time to decimal hours
  const timeToDecimal = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  };

  // ✅ Calculate working hours difference
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const hours = timeToDecimal(checkOut) - timeToDecimal(checkIn);
    return hours > 0 ? hours : 0;
  };

  // ✅ Check if a date is Sunday (0 = Sunday)
  const isSunday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  };

  // ✅ Check if a date is a holiday (you'll need to define your holidays)
  const isHoliday = (dateString) => {
    // Define your holidays here - format: "YYYY-MM-DD"
    const holidays = [
      "2024-01-01", // New Year
      "2024-01-26", // Republic Day
      "2024-08-15", // Independence Day
      "2024-10-02", // Gandhi Jayanti
      // Add more holidays as needed
    ];
    return holidays.includes(dateString);
  };

  // ✅ Determine attendance from working hours with half day support
  const getAttendanceStatus = (entry) => {
    const fullDayHrs = 8.75;
    const halfDayHrs = 4.25;

    // Handle leave statuses
    if (entry.status === "approved") return "fullLeave";
    if (entry.status === "firstHalfApproved") return "firstHalfLeave";
    if (entry.status === "secondHalfApproved") return "secondHalfLeave";

    const workingHrs = calculateWorkingHours(entry.checkIn, entry.checkOut);

    if (workingHrs >= fullDayHrs) return "present";
    if (workingHrs >= halfDayHrs) return "halfDay";
    if (workingHrs > 0 && workingHrs < halfDayHrs) return "halfDay";
    return "absent";
  };

  // ✅ Calculate total working days in month (excluding Sundays and holidays)
  const getTotalWorkingDaysInMonth = (monthData) => {
    let totalDays = 0;

    monthData.forEach((day) => {
      const dateStr = day.date; // Assuming your date field is called 'date'
      if (!isSunday(dateStr) && !isHoliday(dateStr)) {
        totalDays++;
      }
    });

    return totalDays;
  };

  // ✅ Calculate Attendance Summary + Monthly Stats
  function getAttendanceSummary(employees) {
    return employees.map((emp) => {
      const attendance = emp.attendance || {};
      const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
      const monthData = attendance[currentMonth] || [];

      let present = 0,
        halfDay = 0,
        fullLeave = 0,
        firstHalfLeave = 0,
        secondHalfLeave = 0,
        absent = 0;

      monthData.forEach((day) => {
        const status = getAttendanceStatus(day);
        switch (status) {
          case "present":
            present++;
            break;
          case "halfDay":
            halfDay++;
            break;
          case "fullLeave":
            fullLeave++;
            break;
          case "firstHalfLeave":
          case "secondHalfLeave":
            // Count both half leaves as 0.5 in total leave days
            firstHalfLeave += status === "firstHalfLeave" ? 1 : 0;
            secondHalfLeave += status === "secondHalfLeave" ? 1 : 0;
            break;
          case "absent":
            absent++;
            break;
        }
      });

      const totalWorkingDays = getTotalWorkingDaysInMonth(monthData);
      const totalLeaveDays = fullLeave + (firstHalfLeave + secondHalfLeave) * 0.5;
      const effectivePresent = present + halfDay * 0.5;

      return {
        employeeName: emp.name,
        present,
        halfDay,
        fullLeave,
        firstHalfLeave,
        secondHalfLeave,
        totalLeaveDays,
        absent,
        effectivePresent,
        totalWorkingDays,
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
                    {leave.startDate} → {leave.endDate}
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
            Team Attendance (Monthly Summary)
          </h2>
          <p className="text-gray-500 mb-4">
            Attendance overview for {new Date().toLocaleString("en-US", { month: "long" })}.
            Sundays and holidays excluded from total working days.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-gray-800 font-semibold">
                <tr>
                  <th className="py-2 px-3 border">Employee</th>
                  <th className="py-2 px-3 border text-center">Present</th>
                  <th className="py-2 px-3 border text-center">Half Day</th>
                  <th className="py-2 px-3 border text-center">Full Leave</th>
                  <th className="py-2 px-3 border text-center">Half Leave</th>
                  <th className="py-2 px-3 border text-center">Total Leave</th>
                  <th className="py-2 px-3 border text-center">Absent</th>
                  <th className="py-2 px-3 border text-center">Total Days</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSummary.map((emp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-2 px-3 border font-medium">{emp.employeeName}</td>
                    <td className="py-2 px-3 border text-center text-green-600">{emp.present}</td>
                    <td className="py-2 px-3 border text-center text-yellow-600">{emp.halfDay}</td>
                    <td className="py-2 px-3 border text-center text-blue-500">{emp.fullLeave}</td>
                    <td className="py-2 px-3 border text-center text-blue-400">
                      {emp.firstHalfLeave + emp.secondHalfLeave}
                    </td>
                    <td className="py-2 px-3 border text-center text-blue-600 font-medium">
                      {emp.totalLeaveDays}
                    </td>
                    <td className="py-2 px-3 border text-center text-red-600">{emp.absent}</td>
                    <td className="py-2 px-3 border text-center font-semibold">{emp.totalWorkingDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ManagerProfile employeesData={data} />
    </div>
  );
}