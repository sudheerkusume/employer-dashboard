import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import Joi from "joi";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


const employeeSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("employee", "recruiter", "admin").required(),
    password: Joi.string().required(),
    reportingId: Joi.string().trim().length(24).required(),
    attendance: Joi.object().default({}),
    experience: Joi.array().default([]),
    education: Joi.array().default([]),
    profileImage: Joi.string().optional().allow(''),
});

const employeePutSchema = Joi.object({
    id: Joi.string().length(24).required(),
    name: Joi.string().optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().optional().allow(''),
    role: Joi.string().valid("employee", "recruiter", "admin").optional(),
    summary: Joi.string().optional().allow(''),
    experience: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    education: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    attendance: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
    profileImage: Joi.string().optional().allow(''),
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
        const contentType = request.headers.get("content-type") || "";

        const parseJSON = (val) => {
            if (!val) return undefined;
            try { return JSON.parse(val); } catch { return val; }
        };

        let updateFields = {};
        let id;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            id = formData.get("id");
            if (!id) return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

            // Text fields
            for (const key of ["name", "email", "password", "role", "summary"]) {
                const value = formData.get(key);
                if (value !== null && value !== undefined) updateFields[key] = value;
            }

            // Structured fields
            updateFields.experience = parseJSON(formData.get("experience")) || [];
            updateFields.education = parseJSON(formData.get("education")) || [];
            updateFields.attendance = parseJSON(formData.get("attendance")) || {};

            // Handle image
            const file = formData.get("image");
            if (file && file.name) {
                const buffer = Buffer.from(await file.arrayBuffer());

                if (process.env.NODE_ENV === "production") {
                    // Upload to Cloudinary in production
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: "employees" },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(buffer);
                    });
                    updateFields.profileImage = result.secure_url;
                } else {
                    // Save locally in development
                    const uploadDir = path.join(process.cwd(), "public", "uploads");
                    await mkdir(uploadDir, { recursive: true });
                    const fileName = `${Date.now()}-${file.name}`;
                    const filePath = path.join(uploadDir, fileName);
                    await writeFile(filePath, buffer);
                    updateFields.profileImage = `/uploads/${fileName}`;
                }
            } else {
                // If no image uploaded, keep existing image in DB
                updateFields.profileImage = updateFields.profileImage ?? null;
            }
        } else {
            // JSON request
            const body = await request.json();
            const { error, value } = employeePutSchema.validate(body);
            if (error) return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

            id = value.id;
            updateFields = {
                ...value,
                experience: typeof value.experience === "string" ? parseJSON(value.experience) : value.experience || [],
                education: typeof value.education === "string" ? parseJSON(value.education) : value.education || [],
                attendance: typeof value.attendance === "string" ? parseJSON(value.attendance) : value.attendance || {},
                profileImage: value.profileImage || null
            };
        }

        updateFields.modified_on = new Date();

        // Update MongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        return new Response(JSON.stringify({
            success: true,
            message: "Employee updated successfully",
            updatedFields: updateFields
        }), { status: 200 });

    } catch (err) {
        console.error("PUT /api/employees error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
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
