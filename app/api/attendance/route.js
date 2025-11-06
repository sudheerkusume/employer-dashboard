import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

// Constants
const STANDARD_CHECKIN = "09:45";
const STANDARD_CHECKOUT = "16:00";
const EARLY_OUT_CUTOFF = "17:45";
const MAX_LATE_EARLY_COUNT = 3;

// Helpers
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = (timeToMinutes(checkOut) - timeToMinutes(checkIn)) / 60;
  return diff.toFixed(2);
}

// ✅ Updated: added `dayOfWeek` param for Saturday logic
function determineStatusWithRules(checkIn, checkOut, lateEarlyCount = 0, dateStr = null) {
  if (!checkIn) return { status: "absent", workingHours: 0, lossOfPay: 0 };

  let status = "present";
  const checkInMins = timeToMinutes(checkIn);
  const checkOutMins = checkOut ? timeToMinutes(checkOut) : null;

  const standardCheckInMins = timeToMinutes(STANDARD_CHECKIN);

  // 🔹 Determine if Saturday → use 16:00 as cutoff
  let earlyOutMins = timeToMinutes(EARLY_OUT_CUTOFF);
  if (dateStr) {
    const day = new Date(dateStr).getDay(); // 0 = Sun, 6 = Sat
    if (day === 6) {
      earlyOutMins = timeToMinutes(STANDARD_CHECKOUT); // 16:00 cutoff on Saturday
    }
  }

  let late = false;
  let earlyOut = false;

  if (checkInMins > standardCheckInMins) {
    status = "presentLate";
    late = true;
  }

  if (checkOutMins && checkOutMins < earlyOutMins) {
    status = status === "presentLate" ? "lateAndEarlyOut" : "earlyOut";
    earlyOut = true;
  }

  // Only count late/early for loss of pay AFTER first 3
  let lossOfPay = 0;
  if (late || earlyOut) {
    const effectiveCount = lateEarlyCount - 3; // ignore first 3
    if (effectiveCount >= 0) {
      lossOfPay = Math.floor((effectiveCount + 1) / MAX_LATE_EARLY_COUNT); // +1 for current
    }
  }

  const workingHours = checkOut ? calculateWorkingHours(checkIn, checkOut) : 0;

  return { status, workingHours, late, earlyOut, lossOfPay };
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

    const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });

    if (!employee.attendance || typeof employee.attendance !== "object") employee.attendance = {};
    if (!employee.attendance[monthName]) employee.attendance[monthName] = [];

    let todayAttendance = employee.attendance[monthName].find(a => a.date === today);

    // 🔹 Check-in
    if (action === "checkin") {
      if (todayAttendance && todayAttendance.checkIn)
        return Response.json({ message: "Already checked in today" }, { status: 400 });

      const newAttendance = {
        date: today,
        checkIn: nowTime,
        checkOut: "",
        workingHours: "",
        status: "Checked In",
        lossOfPay: 0,
      };

      if (todayAttendance) {
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

    // 🔹 Check-out
    if (action === "checkout") {
      if (!todayAttendance || !todayAttendance.checkIn)
        return Response.json({ message: "No check-in found today" }, { status: 400 });

      if (todayAttendance.checkOut)
        return Response.json({ message: "Already checked out today" }, { status: 400 });

      // Count previous late/early occurrences
      const monthAttendance = employee.attendance[monthName];
      let lateEarlyCount = monthAttendance.reduce((acc, a) => {
        if (["presentLate", "earlyOut", "lateAndEarlyOut"].includes(a.status)) return acc + 1;
        return acc;
      }, 0);

      // Pass `today` for Saturday logic
      const result = determineStatusWithRules(todayAttendance.checkIn, nowTime, lateEarlyCount, today);

      todayAttendance.checkOut = nowTime;
      todayAttendance.workingHours = `${result.workingHours} hrs`;
      todayAttendance.status = result.status;
      todayAttendance.lossOfPay = result.lossOfPay;

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

// ✅ Daily Midnight Job
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

      // Count previous late/early occurrences
      const monthAttendance = emp.attendance[monthName];
      let lateEarlyCount = monthAttendance.reduce((acc, a) => {
        if (["presentLate", "earlyOut", "lateAndEarlyOut"].includes(a.status)) return acc + 1;
        return acc;
      }, 0);

      if (!att) {
        // Absent
        att = { date: yDateStr, checkIn: "", checkOut: "", workingHours: "0 hrs", status: "absent", lossOfPay: 0 };
        emp.attendance[monthName].push(att);
      } else {
        // Auto checkout if missing
        if (!att.checkOut && att.checkIn) att.checkOut = STANDARD_CHECKOUT;

        // ✅ Pass date for Saturday rule
        const result = determineStatusWithRules(att.checkIn, att.checkOut, lateEarlyCount, yDateStr);
        att.status = result.status;
        att.workingHours = att.checkOut ? `${result.workingHours} hrs` : "";
        att.lossOfPay = result.lossOfPay;
      }

      await employees.updateOne({ _id: emp._id }, { $set: { attendance: emp.attendance } });
    }

    console.log("Daily attendance updated at midnight for", yDateStr);
  } catch (err) {
    console.error("Error updating daily attendance:", err);
  }
}
