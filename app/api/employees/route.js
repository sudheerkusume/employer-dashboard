import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";


const employeeSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("employee", "recruiter", "admin").required(),
    password: Joi.string().required(),
    reportingId: Joi.string().trim().length(24).required(),
    attendance: Joi.object().default({}),
    experience: Joi.array().default([]),
    education: Joi.array().default([]),
});

const employeePutSchema = Joi.object({
    id: Joi.string().trim().length(24).required(),
    name: Joi.string().optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    role: Joi.string().valid("employee", "recruiter", "admin").optional(),
    attendance: Joi.object().optional(),
    experience: Joi.array().optional(),
    education: Joi.array().optional(),
    summary: Joi.string().optional().allow(''),
});

export async function GET(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const name = searchParams.get("name");

        // 🔹 Get by _id
        if (id) {
            try {
                const employee = await employeesCollection.findOne({ _id: new ObjectId(id) });
                if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });
                return Response.json(employee);
            } catch (err) {
                return Response.json({ error: "Invalid ID format" }, { status: 400 });
            }
        }

        // 🔹 Search by name (case-insensitive)
        if (name) {
            const employees = await employeesCollection
                .find({ name: { $regex: name, $options: "i" } })
                .toArray();
            return Response.json(employees);
        }

        // 🔹 Return all employees
        const employees = await employeesCollection.find().toArray();
        return Response.json(employees);
    } catch (error) {
        console.error("GET /api/employees error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        const body = await req.json();
        const { error, value } = employeeSchema.validate(body);

        if (error) return Response.json({ error: error.details[0].message }, { status: 400 });

        // ✅ Only check email
        const exists = await employeesCollection.findOne({ email: value.email });
        if (exists) return Response.json({ error: "Employee with this email already exists" }, { status: 400 });

        const result = await employeesCollection.insertOne(value);
        return Response.json({ success: true, employee: value, insertedId: result.insertedId });
    } catch (err) {
        console.error("POST /api/employees error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();

        const { error, value } = employeePutSchema.validate(body);
        if (error) {
            const errorMessages = error.details.map((d) => d.message).join(", ");
            return new Response(JSON.stringify({ error: errorMessages }), { status: 403 });
        }

        const { id, name, summary, email, role, attendance, experience, education } = value;
        const query = { _id: new ObjectId(id) };

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        // Only include keys that are explicitly provided (even if null or empty string)
        const updateFields = {};
        if ("name" in value) updateFields.name = name;
        if ("email" in value) updateFields.email = email;
        if ("role" in value) updateFields.role = role;
        if ("attendance" in value) updateFields.attendance = attendance;
        if ("experience" in value) updateFields.experience = experience;
        if ("education" in value) updateFields.education = education;
        if ("summary" in value) updateFields.summary = summary;

        updateFields.modified_on = new Date();

        // Perform update
        const result = await employeesCollection.updateOne(query, { $set: updateFields });

        if (result.matchedCount === 0) {
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });
        }

        return new Response(
            JSON.stringify({ success: true, message: `Updated Employee with id: ${id}` }),
            { status: 200 }
        );
    } catch (error) {
        console.error("PUT /api/employees error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return Response.json({ error: "Employee ID is required" }, { status: 400 });

        const result = await employeesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return Response.json({ error: "Employee not found" }, { status: 404 });

        return Response.json({ success: true, message: "Employee deleted successfully" });
    } catch (err) {
        console.error("DELETE /api/employees error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
