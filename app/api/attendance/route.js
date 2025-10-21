import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

// Helper: calculate working hours
function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`1970-01-01T${checkIn}:00`);
  const end = new Date(`1970-01-01T${checkOut}:00`);
  const diff = (end - start) / (1000 * 60 * 60);
  return diff.toFixed(2);
}

// Helper: determine status
function determineStatus(checkIn, checkOut) {
  if (checkIn && checkOut) {
    const wh = calculateWorkingHours(checkIn, checkOut);
    if (wh >= 8) return "present";
    if (wh >= 4) return "halfDay";
  }

  if (checkIn) {
    const [h, m] = checkIn.split(":").map(Number);
    const totalMins = h * 60 + m;
    if (totalMins < 13 * 60) return "firstHalf"; // before 1 PM
    return "secondHalf"; // after 1 PM
  }

  return "absent";
}

// ✅ API route for check-in / check-out
export async function POST(req) {
  try {
    const body = await req.json();
    const { employeeId, action, time, date } = body;
    if (!employeeId || !action)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const today = date || new Date().toISOString().split("T")[0];
    const nowTime = time || new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5);
    const monthName = new Date(today).toLocaleString("default", { month: "long" });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DBNAME);
    const employees = db.collection("employees");

    // 🔹 Find existing employee by ObjectId
    const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });

    // Ensure attendance object exists
    if (!employee.attendance || typeof employee.attendance !== "object") employee.attendance = {};
    if (!employee.attendance[monthName]) employee.attendance[monthName] = [];

    // Find today's attendance
    let todayAttendance = employee.attendance[monthName].find(a => a.date === today);

    if (action === "checkin") {
      if (todayAttendance && todayAttendance.checkIn)
        return Response.json({ message: "Already checked in today" }, { status: 400 });

      const newAttendance = {
        date: today,
        checkIn: nowTime,
        checkOut: "",
        workingHours: "",
        status: "Checked In",
      };

      if (todayAttendance) {
        // Update existing record
        todayAttendance.checkIn = nowTime;
        todayAttendance.status = "Checked In";
      } else {
        employee.attendance[monthName].push(newAttendance);
      }

      await employees.updateOne(
        { _id: new ObjectId(employeeId) },
        { $set: { attendance: employee.attendance } }
      );

      return Response.json({ success: true, attendance: todayAttendance || newAttendance });
    }

    if (action === "checkout") {
      if (!todayAttendance || !todayAttendance.checkIn)
        return Response.json({ message: "No check-in found today" }, { status: 400 });

      if (todayAttendance.checkOut)
        return Response.json({ message: "Already checked out today" }, { status: 400 });

      const wh = calculateWorkingHours(todayAttendance.checkIn, nowTime);
      const status = determineStatus(todayAttendance.checkIn, nowTime);

      todayAttendance.checkOut = nowTime;
      todayAttendance.workingHours = `${wh} hrs`;
      todayAttendance.status = status;

      await employees.updateOne(
        { _id: new ObjectId(employeeId) },
        { $set: { attendance: employee.attendance } }
      );

      return Response.json({ success: true, attendance: todayAttendance });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Attendance API Error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ Function to run at midnight to finalize statuses
export async function updateDailyAttendance() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DBNAME);
    const employees = db.collection("employees");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDateStr = yesterday.toISOString().split("T")[0];
    const monthName = yesterday.toLocaleString("default", { month: "long" });

    const allEmployees = await employees.find({}).toArray();

    for (const emp of allEmployees) {
      if (!emp.attendance || typeof emp.attendance !== "object") emp.attendance = {};
      if (!emp.attendance[monthName]) emp.attendance[monthName] = [];

      let att = emp.attendance[monthName].find(a => a.date === yDateStr);

      if (!att) {
        // Absent
        att = { date: yDateStr, checkIn: "", checkOut: "", workingHours: "0 hrs", status: "absent" };
        emp.attendance[monthName].push(att);
      } else {
        // Update working hours & status
        const wh = calculateWorkingHours(att.checkIn, att.checkOut);
        att.workingHours = att.checkOut ? `${wh} hrs` : "";
        att.status = determineStatus(att.checkIn, att.checkOut);
      }

      await employees.updateOne({ _id: emp._id }, { $set: { attendance: emp.attendance } });
    }

    console.log("Daily attendance updated at midnight for", yDateStr);
  } catch (err) {
    console.error("Error updating daily attendance:", err);
  }
}
