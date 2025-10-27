import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});



const employeeSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("employee", "manager", "admin").required(),
    password: Joi.string().required(),
    reportingId: Joi.string().trim().length(24).required(),
    attendance: Joi.object().default({}),
    experience: Joi.array().default([]),
    education: Joi.array().default([]),
    profileImage: Joi.string().optional().allow(''),
    dateOfJoining: Joi.date().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid("male", "female", "other").required(),
    mobile: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            "string.pattern.base": "Mobile number must be between 10 to 15 digits",
        }),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/),
    newPassword: Joi.string().min(6).required(),
}).xor("email", "mobile");

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

        if (error)
            return Response.json({ error: error.details[0].message }, { status: 400 });

        // ✅ Only check email
        const exists = await employeesCollection.findOne({ email: value.email });
        if (exists)
            return Response.json({ error: "Employee with this email already exists" }, { status: 400 });

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
        const parseJSON = (val) => { try { return JSON.parse(val); } catch { return val; } };

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        let id;
        let updateFields = {};

        // 🔹 Case 1: Handle multipart form data (profile updates, image upload)
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            id = formData.get("id");
            if (!id) return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

            // Text fields
            for (const key of ["name", "email", "password", "role", "summary"]) {
                const value = formData.get(key);
                if (value) updateFields[key] = value;
            }

            updateFields.experience = parseJSON(formData.get("experience")) || [];
            updateFields.education = parseJSON(formData.get("education")) || [];
            updateFields.attendance = parseJSON(formData.get("attendance")) || {};

            // Handle profile image upload
            const file = formData.get("image");
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: "employees" },
                        (err, res) => err ? reject(err) : resolve(res)
                    );
                    uploadStream.end(buffer);
                });
                updateFields.profileImage = result.secure_url;
            }

            updateFields.modified_on = new Date();

            const result = await employeesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );

            if (result.matchedCount === 0)
                return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

            return new Response(JSON.stringify({ success: true, updatedFields: updateFields }), { status: 200 });
        }

        // 🔹 Case 2: Handle JSON body (including password reset)
        const body = await request.json();

        // ✅ Check if this is a password reset request
        if (body.newPassword && (body.email || body.mobile)) {
            const { error, value } = resetPasswordSchema.validate(body);
            if (error)
                return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

            const query = {};
            if (value.email) query.email = value.email;
            if (value.mobile) query.mobile = value.mobile;

            const existingUser = await employeesCollection.findOne(query);
            if (!existingUser)
                return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

            const result = await employeesCollection.updateOne(
                { _id: existingUser._id },
                { $set: { password: value.newPassword, modified_on: new Date() } }
            );

            return new Response(JSON.stringify({ success: true, message: "Password reset successful" }), { status: 200 });
        }

        // 🔹 Otherwise, it's a normal update request
        id = body.id;
        if (!id) return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

        updateFields = { ...body, modified_on: new Date() };

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        return new Response(JSON.stringify({ success: true, updatedFields: updateFields }), { status: 200 });
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
