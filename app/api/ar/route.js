import { ObjectId } from "mongodb";
import Joi from "joi";
import { format, getDay, isAfter, eachDayOfInterval } from "date-fns";
import clientPromise from "@/app/components/lib/db";

/* -------------------------------------------------------------------------- */
/* ✅ Validation Schemas                                                      */
/* -------------------------------------------------------------------------- */
const regularizationSchema = Joi.object({
    employeeId: Joi.string().required(),
    dateFrom: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    dateTo: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    inTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    outTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    reason: Joi.string().min(3).required(),
    type: Joi.string().valid("regularization").required(),
});

const arActionSchema = Joi.object({
    requestId: Joi.string().required(),
    action: Joi.string().valid("approve", "reject").required(),
    remarks: Joi.string().allow("", null),
    managerId: Joi.string().required(),
});

const leaveActionSchema = Joi.object({
    managerId: Joi.string().required(),
    employeeId: Joi.string().required(),
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate().required(),
    status: Joi.string().valid("approved", "rejected").required(),
});

/* -------------------------------------------------------------------------- */
/* 🟢 POST — Apply Regularization (Supports Date Range)                       */
/* -------------------------------------------------------------------------- */
export async function POST(request) {
    try {
        const body = await request.json();
        const { error, value } = regularizationSchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

        const { employeeId, dateFrom, dateTo, inTime, outTime, reason } = value;
        const client = await clientPromise;
        const db = client.db();
        const employees = db.collection("employees");

        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        // Use employee's reporting manager instead of managerId from request
        const managerId = employee.reportingId;
        if (!managerId) {
            return new Response(JSON.stringify({ error: "Employee has no reporting manager" }), { status: 400 });
        }

        const dates = eachDayOfInterval({
            start: new Date(dateFrom),
            end: new Date(dateTo),
        });

        const regEntries = [];
        for (const d of dates) {
            const formattedDate = format(d, "yyyy-MM-dd");
            const monthName = d.toLocaleString("default", { month: "long" });

            if (isAfter(d, new Date()))
                return new Response(JSON.stringify({ error: "Cannot regularize future dates." }), { status: 400 });
            if (getDay(d) === 0)
                return new Response(JSON.stringify({ error: "Cannot regularize Sundays." }), { status: 400 });

            const existing = employee.attendance?.[monthName]?.find(
                (day) => day.date === formattedDate && day.status === "pendingRegularization"
            );
            if (existing)
                return new Response(JSON.stringify({ error: `Regularization already exists for ${formattedDate}` }), { status: 400 });

            const regEntry = {
                date: formattedDate,
                inTime,
                outTime,
                reason,
                status: "pendingRegularization",
                requestedOn: new Date().toISOString(),
            };

            await employees.updateOne(
                { _id: new ObjectId(employeeId) },
                { $push: { [`attendance.${monthName}`]: regEntry } }
            );

            regEntries.push({ formattedDate, monthName });
        }

        // 🔹 Notify Manager (use employee's actual reporting manager)
        const manager = await employees.findOne({ _id: new ObjectId(managerId) });
        if (manager) {
            const records = regEntries.map(({ formattedDate }) => ({
                _id: new ObjectId(),
                employeeId,
                employeeName: employee.name,
                date: formattedDate,
                inTime,
                outTime,
                reason,
                status: "pendingRegularization",
                appliedOn: new Date().toISOString(),
            }));

            const updateFields = {};
            if (!Array.isArray(manager.pendingRegularizations))
                updateFields.pendingRegularizations = [];
            if (!Array.isArray(manager.regularizations))
                updateFields.regularizations = [];

            if (Object.keys(updateFields).length > 0)
                await employees.updateOne({ _id: manager._id }, { $set: updateFields });

            await employees.updateOne(
                { _id: manager._id },
                { $push: { pendingRegularizations: { $each: records } } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Regularization submitted for ${format(new Date(dateFrom), "yyyy-MM-dd")} to ${format(
                    new Date(dateTo),
                    "yyyy-MM-dd"
                )}.`,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error applying regularization:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE — Withdraw Regularization (Date Range Support)                   */
/* -------------------------------------------------------------------------- */
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const dateFrom = searchParams.get("startDate");
        const dateTo = searchParams.get("endDate");

        if (!employeeId || !dateFrom || !dateTo) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const employees = db.collection("employees");

        // Get employee details to find reporting manager
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });
        }

        const dates = eachDayOfInterval({
            start: new Date(dateFrom),
            end: new Date(dateTo),
        });

        const dateStrings = dates.map(d => format(d, "yyyy-MM-dd"));

        // Remove from employee's attendance
        for (const d of dates) {
            const monthName = d.toLocaleString("default", { month: "long" });
            const formattedDate = format(d, "yyyy-MM-dd");

            await employees.updateOne(
                { _id: new ObjectId(employeeId) },
                { $pull: { [`attendance.${monthName}`]: { date: formattedDate, status: "pendingRegularization" } } }
            );
        }

        // Remove from manager's pendingRegularizations
        if (employee.reportingId) {
            await employees.updateOne(
                { _id: new ObjectId(employee.reportingId) },
                {
                    $pull: {
                        pendingRegularizations: {
                            employeeId: employeeId,
                            date: { $in: dateStrings }
                        }
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Regularization withdrawn successfully." }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error withdrawing regularization:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

/* -------------------------------------------------------------------------- */
/* 🟣 PUT — Approve / Reject AR (Attendance Regularization)                   */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* 🟣 PUT — Approve / Reject AR (Attendance Regularization)                   */
/* -------------------------------------------------------------------------- */
export async function PUT(request) {
    try {
        const body = await request.json();
        const { error, value } = arActionSchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

        const { requestId, action, remarks, managerId } = value;

        const client = await clientPromise;
        const db = client.db();
        const employees = db.collection("employees");

        // Find manager
        const manager = await employees.findOne({ _id: new ObjectId(managerId) });
        if (!manager) {
            return new Response(JSON.stringify({ error: "Manager not found" }), { status: 404 });
        }

        // Find the pending regularization request
        const pendingRequest = manager.pendingRegularizations?.find(
            req => req._id.toString() === requestId
        );

        if (!pendingRequest) {
            return new Response(JSON.stringify({ error: "Regularization request not found" }), { status: 404 });
        }

        const { employeeId, date, employeeName, inTime, outTime, reason } = pendingRequest;

        // Find employee
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });
        }

        const monthName = new Date(date).toLocaleString("default", { month: "long" });
        const newStatus = action === "approve" ? "approvedRegularization" : "rejectedRegularization";

        if (action === "approve") {
            // ✅ APPROVED: Update attendance with checkIn/checkOut and mark as present
            const updateResult = await employees.updateOne(
                {
                    _id: new ObjectId(employeeId),
                    [`attendance.${monthName}.date`]: date
                },
                {
                    $set: {
                        [`attendance.${monthName}.$.status`]: "present", // Mark as present
                        [`attendance.${monthName}.$.checkIn`]: inTime,
                        [`attendance.${monthName}.$.checkOut`]: outTime,
                        [`attendance.${monthName}.$.workingHours`]: calculateWorkingHours(inTime, outTime, date),
                        [`attendance.${monthName}.$.regularizationStatus`]: "approved", // Track regularization separately
                        [`attendance.${monthName}.$.reviewedBy`]: manager.name,
                        [`attendance.${monthName}.$.reviewedOn`]: new Date().toISOString(),
                        [`attendance.${monthName}.$.remarks`]: remarks || ""
                    }
                }
            );

            if (updateResult.modifiedCount === 0) {
                // If the attendance record doesn't exist, create a new one
                await employees.updateOne(
                    { _id: new ObjectId(employeeId) },
                    {
                        $push: {
                            [`attendance.${monthName}`]: {
                                date: date,
                                status: "present",
                                checkIn: inTime,
                                checkOut: outTime,
                                workingHours: calculateWorkingHours(inTime, outTime, date),
                                regularizationStatus: "approved",
                                reviewedBy: manager.name,
                                reviewedOn: new Date().toISOString(),
                                remarks: remarks || "",
                                reason: reason
                            }
                        }
                    }
                );
            }
        } else {
            // ❌ REJECTED: Keep the record but mark as rejected
            const updateResult = await employees.updateOne(
                {
                    _id: new ObjectId(employeeId),
                    [`attendance.${monthName}.date`]: date
                },
                {
                    $set: {
                        [`attendance.${monthName}.$.status`]: "rejectedRegularization",
                        [`attendance.${monthName}.$.reviewedBy`]: manager.name,
                        [`attendance.${monthName}.$.reviewedOn`]: new Date().toISOString(),
                        [`attendance.${monthName}.$.remarks`]: remarks || ""
                    }
                }
            );

            if (updateResult.modifiedCount === 0) {
                // If record doesn't exist, create with rejected status
                await employees.updateOne(
                    { _id: new ObjectId(employeeId) },
                    {
                        $push: {
                            [`attendance.${monthName}`]: {
                                date: date,
                                status: "rejectedRegularization",
                                inTime: inTime,
                                outTime: outTime,
                                reason: reason,
                                regularizationStatus: "rejected",
                                reviewedBy: manager.name,
                                reviewedOn: new Date().toISOString(),
                                remarks: remarks || "",
                                requestedOn: pendingRequest.appliedOn
                            }
                        }
                    }
                );
            }
        }

        // Remove from manager's pendingRegularizations
        await employees.updateOne(
            { _id: new ObjectId(managerId) },
            { $pull: { pendingRegularizations: { _id: new ObjectId(requestId) } } }
        );

        // Add to manager's approved/rejected regularizations
        const reviewedRecord = {
            _id: new ObjectId(requestId),
            employeeId,
            employeeName,
            date,
            inTime,
            outTime,
            reason,
            status: newStatus,
            reviewedBy: manager.name,
            reviewedOn: new Date().toISOString(),
            remarks: remarks || "",
            appliedOn: pendingRequest.appliedOn
        };

        const fieldName = action === "approve" ? "approvedRegularizations" : "rejectedRegularizations";

        // Initialize array if it doesn't exist
        if (!Array.isArray(manager[fieldName])) {
            await employees.updateOne(
                { _id: new ObjectId(managerId) },
                { $set: { [fieldName]: [] } }
            );
        }

        await employees.updateOne(
            { _id: new ObjectId(managerId) },
            { $push: { [fieldName]: reviewedRecord } }
        );

        return new Response(
            JSON.stringify({
                success: true,
                message: `Regularization ${action}d successfully for ${date}`,
                data: reviewedRecord
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error processing regularization action:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}


// Helper function to calculate working hours
function calculateWorkingHours(checkIn, checkOut, date) {
    if (!checkIn || !checkOut) return 0;

    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const start = inH * 60 + inM;
    const end = outH * 60 + outM;

    let diffMinutes = Math.max(0, end - start);

    // Adjust for lunch break based on day
    const day = new Date(date).getDay();
    if (day !== 6) { // Not Saturday
        // Subtract 1 hour lunch break for normal days
        diffMinutes = Math.max(0, diffMinutes - 60);
    } else {
        // Saturday: Subtract 30 minutes lunch break
        diffMinutes = Math.max(0, diffMinutes - 30);
    }

    return (diffMinutes / 60).toFixed(2); // hours as decimal
}