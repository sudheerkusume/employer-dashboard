
export default function ManagerDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">Team Leaves & Approvals</div>
        <div className="p-4 bg-white rounded shadow">Team Attendance</div>
      </div>
    </div>
  );
}
