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
    checkIn: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    checkOut: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
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

        const { employeeId, dateFrom, dateTo, checkIn, checkOut, reason } = value;
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
                checkIn,
                checkOut,
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
                checkIn,
                checkOut,
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
        console.log("❌ Error applying regularization:", err);
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
        console.log("❌ Error withdrawing regularization:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

/* -------------------------------------------------------------------------- */
/* 🟣 PUT — Approve / Reject AR (Attendance Regularization)                   */
/* -------------------------------------------------------------------------- */
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

        /* ------------------------------------------------------------------ */
        /* 1️⃣ Fetch Manager                                                   */
        /* ------------------------------------------------------------------ */
        const manager = await employees.findOne({ _id: new ObjectId(managerId) });

        if (!manager)
            return new Response(JSON.stringify({ error: "Manager not found" }), { status: 404 });

        /* ------------------------------------------------------------------ */
        /* 2️⃣ Find the pending regularization request                         */
        /* ------------------------------------------------------------------ */
        const pendingRequest = manager.pendingRegularizations?.find(
            (req) => req._id.toString() === requestId
        );

        if (!pendingRequest) {
            return new Response(JSON.stringify({ error: "Regularization request not found" }), { status: 404 });
        }

        const { employeeId, date, checkIn, checkOut, reason, employeeName } = pendingRequest;

        /* ------------------------------------------------------------------ */
        /* 3️⃣ Fetch Employee                                                  */
        /* ------------------------------------------------------------------ */
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });

        if (!employee)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        const monthName = new Date(date).toLocaleString("default", { month: "long" });

        /* ------------------------------------------------------------------ */
        /* 4️⃣ APPROVE FLOW — Replace the pending object                       */
        /* ------------------------------------------------------------------ */
        if (action === "approve") {
            const approvedRecord = {
                date,
                checkIn: checkIn,
                checkOut: checkOut,
                workingHours: calculateWorkingHours(checkIn, checkOut, date),
                reason,
                status: "present",
                regularizationStatus: "approved",
                reviewedBy: manager.name,
                reviewedOn: new Date().toISOString(),
                remarks: remarks || "",
                requestedOn: pendingRequest.appliedOn
            };

            // Replace pending object
            await employees.updateOne(
                {
                    _id: new ObjectId(employeeId),
                    [`attendance.${monthName}.date`]: date
                },
                {
                    $set: {
                        [`attendance.${monthName}.$`]: approvedRecord
                    }
                }
            );
        }

        /* ------------------------------------------------------------------ */
        /* 5️⃣ REJECT FLOW — Remove the pending object completely              */
        /* ------------------------------------------------------------------ */
        if (action === "reject") {
            await employees.updateOne(
                { _id: new ObjectId(employeeId) },
                {
                    $pull: {
                        [`attendance.${monthName}`]: {
                            date: date,
                            status: "pendingRegularization"
                        }
                    }
                }
            );
        }

        /* ------------------------------------------------------------------ */
        /* 6️⃣ Remove from manager.pendingRegularizations                      */
        /* ------------------------------------------------------------------ */
        await employees.updateOne(
            { _id: new ObjectId(managerId) },
            {
                $pull: {
                    pendingRegularizations: { _id: new ObjectId(requestId) }
                }
            }
        );

        /* ------------------------------------------------------------------ */
        /* 7️⃣ Add record to manager's approved / rejected list                */
        /* ------------------------------------------------------------------ */
        const reviewedRecord = {
            _id: new ObjectId(requestId),
            employeeId,
            employeeName,
            date,
            checkIn,
            checkOut,
            reason,
            remarks: remarks || "",
            status: action === "approve" ? "approved" : "rejected",
            reviewedBy: manager.name,
            reviewedOn: new Date().toISOString(),
            appliedOn: pendingRequest.appliedOn
        };

        const fieldName = action === "approve" ? "approvedRegularizations" : "rejectedRegularizations";

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
        console.log("❌ Error processing regularization action:", err);
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