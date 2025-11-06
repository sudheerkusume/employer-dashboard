import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";

// --- Joi Schema for Event ---
const eventSchema = Joi.object({
    employeeId: Joi.string().required(),
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().allow(""),
    date: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    type: Joi.string().valid("holiday", "meeting", "training", "birthday", "general").default("general"),
});

const updateSchema = Joi.object({
    employeeId: Joi.string().required(),
    eventId: Joi.string().required(),
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().allow(""),
    date: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).required(),
    type: Joi.string().valid("holiday", "meeting", "training", "birthday", "general").default("general"),
});

// ✅ POST: Add a new Event
export async function POST(req) {
    try {
        const body = await req.json();

        const { error, value } = eventSchema.validate(body);
        if (error)
            return Response.json({ error: error.details[0].message }, { status: 400 });

        const { employeeId, title, description, date, type } = value;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employees = db.collection("employees");

        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee)
            return Response.json({ error: "Employee not found" }, { status: 404 });

        const newEvent = {
            _id: new ObjectId(),
            title,
            description,
            date,
            type,
            createdAt: new Date().toISOString(),
        };

        await employees.updateOne(
            { _id: new ObjectId(employeeId) },
            { $push: { events: newEvent } }
        );

        return Response.json({
            success: true,
            message: "Event added successfully",
            event: newEvent,
        });
    } catch (err) {
        console.error("❌ Error adding event:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ✅ PUT: Update an Event
export async function PUT(req) {
    try {
        const body = await req.json();

        // Validate the incoming data
        const { error, value } = updateSchema.validate(body);
        if (error) {
            return Response.json({ error: error.details[0].message }, { status: 400 });
        }

        const { employeeId, eventId, title, description, date, type } = value;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employees = db.collection("employees");

        // Check if employee exists
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return Response.json({ error: "Employee not found" }, { status: 404 });
        }

        // Check if event exists inside the employee record
        const eventExists = employee.events?.some(
            (e) => e._id.toString() === eventId
        );
        if (!eventExists) {
            return Response.json({ error: "Event not found" }, { status: 404 });
        }

        // Perform the update
        await employees.updateOne(
            { _id: new ObjectId(employeeId), "events._id": new ObjectId(eventId) },
            {
                $set: {
                    "events.$.title": title,
                    "events.$.description": description,
                    "events.$.date": date,
                    "events.$.type": type,
                    "events.$.updatedAt": new Date().toISOString(),
                },
            }
        );

        return Response.json({
            success: true,
            message: "Event updated successfully",
            updated: { employeeId, eventId, title, description, date, type },
        });
    } catch (err) {
        console.error("❌ Error updating event:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
