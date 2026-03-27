import { MongoClient, ObjectId } from "mongodb";
import Joi from "joi";
import { eachDayOfInterval, format, getDay } from "date-fns";

// --- MongoDB Connection ---
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/yourdb";
let client;
let db;

async function connectDB() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db();
        console.log("✅ MongoDB connected");
    }
    return db;
}

// --- Joi Schema ---
const leaveApplySchema = Joi.object({
    employeeId: Joi.string().required(),
    startDate: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    endDate: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    leaveType: Joi.string().valid("casual", "earned", "sick", "emergency", "first half", "second half").default("casual"),
    reason: Joi.string().min(3).required(),
});

// --- POST API Handler ---
export async function POST(request) {
    try {
        const body = await request.json();

        // Validate request body
        const { error, value } = leaveApplySchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

        const { employeeId, startDate, endDate, leaveType, reason } = value;
        const db = await connectDB();
        const employees = db.collection("employees");

        // Find employee
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        // --- Generate all dates in the leave range ---
        const leaveDates = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate),
        }).map(d => format(d, "yyyy-MM-dd"));

        // --- 🚫 Block ALL Mondays (1) and Saturdays (6) ---
        const invalidDays = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate),
        }).filter(date => {
            const day = getDay(date); // Sunday = 0, Monday = 1, ..., Saturday = 6
            return day === 1 || day === 6;
        });

        if (invalidDays.length > 0) {
            const formatted = invalidDays.map(d => format(d, "EEE dd MMM yyyy")).join(", ");
            return new Response(
                JSON.stringify({
                    error: `Leave cannot be applied on Mondays or Saturdays. Invalid dates: ${formatted}`,
                }),
                { status: 400 }
            );
        }

        // --- Check if any leave already exists for these dates ---
        const existingDates = [];
        if (employee.attendance) {
            for (const month of Object.keys(employee.attendance)) {
                employee.attendance[month].forEach(entry => {
                    if (leaveDates.includes(entry.date)) {
                        existingDates.push(entry.date);
                    }
                });
            }
        }

        if (existingDates.length > 0) {
            return new Response(
                JSON.stringify({ error: `Leave already applied for dates: ${existingDates.join(", ")}` }),
                { status: 400 }
            );
        }

        // --- Group by month ---
        const groupedByMonth = {};
        leaveDates.forEach(d => {
            const month = new Date(d).toLocaleString("default", { month: "long" });
            if (!groupedByMonth[month]) groupedByMonth[month] = [];
            groupedByMonth[month].push(d);
        });

        // --- Add leave entries to employee attendance ---
        for (const [monthName, dates] of Object.entries(groupedByMonth)) {
            for (const date of dates) {
                let leaveEntry;
                leaveEntry = {
                    date,
                    status: "pending",
                    leaveType,
                    reason,
                    markedOn: new Date().toISOString(),
                };
                await employees.updateOne(
                    { _id: new ObjectId(employeeId) },
                    { $push: { [`attendance.${monthName}`]: leaveEntry } }
                );
            }
        }

        // --- Assign leave to reporting manager ---
        if (["employee", "manager"].includes(employee.role) && employee.reportingId) {
            const managerId = new ObjectId(employee.reportingId);
            const leaveRecord = {
                _id: new ObjectId(),
                employeeId,
                employeeName: employee.name,
                startDate,
                endDate,
                leaveDates,
                leaveType,
                reason,
                status: "pending",
                appliedOn: new Date().toISOString(),
            };

            const manager = await employees.findOne({ _id: managerId });
            if (!manager)
                return new Response(JSON.stringify({ error: "Reporting manager not found" }), { status: 404 });

            const updateFields = {};
            if (!Array.isArray(manager.pendingLeaves)) updateFields.pendingLeaves = [];
            if (!Array.isArray(manager.leaves)) updateFields.leaves = [];

            if (Object.keys(updateFields).length > 0) {
                await employees.updateOne({ _id: managerId }, { $set: updateFields });
            }

            await employees.updateOne(
                { _id: managerId },
                { $push: { pendingLeaves: leaveRecord, leaves: leaveRecord } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Leave from ${startDate} to ${endDate} applied successfully and added to manager's record.`,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.log("❌ Error applying leave:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
