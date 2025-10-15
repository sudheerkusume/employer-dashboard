
export default function HRDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">HR Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">Manage Users (use API /dashboard/admin UI)</div>
        <div className="p-4 bg-white rounded shadow">Manage Holidays</div>
        <div className="p-4 bg-white rounded shadow">View Attendance Summary</div>
        <div className="p-4 bg-white rounded shadow">View All Leaves</div>
      </div>
    </div>
  );
}
