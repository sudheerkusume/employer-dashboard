import { MongoClient, ObjectId } from "mongodb";
import Joi from "joi";
import { eachDayOfInterval, format } from "date-fns";

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
const approveLeaveSchema = Joi.object({
    managerId: Joi.string().required(),
    employeeId: Joi.string().required(),
    startDate: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    endDate: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    status: Joi.string().valid("approved", "rejected").required(),
});

// --- PUT API Handler ---
export async function PUT(request) {
    try {
        const body = await request.json();
        const { error, value } = approveLeaveSchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), {
                status: 400,
            });

        const { managerId, employeeId, startDate, endDate, status } = value;

        const db = await connectDB();
        const employees = db.collection("employees");

        // --- Verify manager ---
        const manager = await employees.findOne({ _id: new ObjectId(managerId) });
        if (!manager)
            return new Response(JSON.stringify({ error: "Manager not found" }), {
                status: 404,
            });
        if (manager.role !== "manager")
            return new Response(
                JSON.stringify({ error: "Only managers can approve/reject leaves." }),
                { status: 403 }
            );

        // --- Fetch employee ---
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee)
            return new Response(JSON.stringify({ error: "Employee not found" }), {
                status: 404,
            });

        // --- Generate leave dates ---
        const leaveDates = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate),
        }).map((d) => format(d, "yyyy-MM-dd"));

        // --- Group by month for easy access ---
        const groupedByMonth = {};
        leaveDates.forEach((d) => {
            const month = new Date(d).toLocaleString("default", { month: "long" });
            if (!groupedByMonth[month]) groupedByMonth[month] = [];
            groupedByMonth[month].push(d);
        });

        // --- Update or Remove Employee Attendance ---
        for (const [monthName, dates] of Object.entries(groupedByMonth)) {
            const attendanceKey = `attendance.${monthName}`;

            if (status === "approved") {
                // ✅ APPROVED: update status for those dates
                for (const date of dates) {
                    const dayEntry = employee.attendance?.[monthName]?.find(
                        (d) => d.date === date
                    );
                    if (!dayEntry) continue;

                    let newStatus = "approved";

                    if (dayEntry.leaveType === "first half")
                        newStatus = "firstHalfApproved";
                    else if (dayEntry.leaveType === "second half")
                        newStatus = "secondHalfApproved";

                    await employees.updateOne(
                        { _id: new ObjectId(employeeId), [`${attendanceKey}.date`]: date },
                        { $set: { [`${attendanceKey}.$.status`]: newStatus } }
                    );
                }
            } else if (status === "rejected") {
                // ❌ REJECTED: completely remove those leave records
                await employees.updateOne(
                    { _id: new ObjectId(employeeId) },
                    {
                        $pull: {
                            [attendanceKey]: { date: { $in: dates } },
                        },
                    }
                );
            }
        }

        // --- Remove from manager pendingLeaves ---
        await employees.updateOne(
            { _id: new ObjectId(managerId) },
            { $pull: { pendingLeaves: { employeeId, startDate, endDate } } }
        );

        // --- Update manager logs (only for approved leaves) ---
        if (status === "approved") {
            const leaveRecord = {
                _id: new ObjectId(),
                employeeId,
                employeeName: employee.name,
                startDate,
                endDate,
                leaveDates,
                leaveType: employee.leaveType || "casual",
                reason: employee.reason || "",
                status,
                reviewedOn: new Date().toISOString(),
            };

            await employees.updateOne(
                { _id: new ObjectId(managerId) },
                { $push: { leaves: leaveRecord } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    status === "approved"
                        ? `Leave approved successfully for ${employee.name}.`
                        : `Leave rejected and removed for ${employee.name}.`,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error in leave approval:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
