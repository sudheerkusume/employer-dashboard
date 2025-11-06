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

// Dummy logos array
const dummyLogos = [
    'https://placehold.co/48x48/F0F0F0/000000?text=Google',
    'https://placehold.co/48x48/F0F0F0/000000?text=Facebook',
    'https://placehold.co/48x48/F0F0F0/000000?text=LinkedIn',
    'https://placehold.co/48x48/F0F0F0/000000?text=Microsoft',
    'https://placehold.co/48x48/F0F0F0/000000?text=YouTube',
];

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
    department: Joi.string().required(),
    designation: Joi.string().required(),
    ctc: Joi.string().required(),
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

// --- Generate next Employee Code based on department ---
function generateNextCode(latestNum, department) {
    let prefix = "REZ"; // Default
    switch ((department || "").toLowerCase()) {
        case "tech":
            prefix = "REZT";
            break;
        case "sales":
            prefix = "REZS";
            break;
        case "admin":
            prefix = "REZA";
            break;
        default:
            prefix = "REZ";
    }

    const nextNum = (latestNum || 0) + 1;
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function POST(request) {
    try {
        const body = await request.json();

        // ✅ Validate body
        const { error, value } = employeeSchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), {
                status: 400,
            });

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employees = db.collection("employees");

        // --- Find the latest cumulative numeric part across all departments ---
        const latestEmployee = await employees
            .find({ employeeCode: { $exists: true } })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        let latestNum = 0;
        if (latestEmployee.length && latestEmployee[0].employeeCode) {
            const match = latestEmployee[0].employeeCode.match(/(\d{3})$/);
            if (match) latestNum = parseInt(match[1], 10);
        }

        // --- Generate department-based prefix + cumulative numeric code ---
        const newCode = generateNextCode(latestNum, value.department);

        // --- Build new employee data ---
        const newEmployee = {
            ...value,
            employeeCode: newCode,
            createdAt: new Date(),
            modified_on: new Date(),
            attendance: {},
            accountDetails: {},
        };

        // --- Insert into DB ---
        const result = await employees.insertOne(newEmployee);

        return new Response(
            JSON.stringify({
                success: true,
                message: `Employee ${newCode} added successfully.`,
                employeeCode: newCode,
                insertedId: result.insertedId,
            }),
            { status: 201 }
        );
    } catch (err) {
        console.error("❌ Error adding employee:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
        });
    }
}

export async function PUT(request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        const parseJSON = (val) => { try { return JSON.parse(val); } catch { return val; } };

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        let employeeId;
        let updateFields = {};

        // ✅ Multipart (FormData) case - Handle profile updates + documents
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            employeeId = formData.get("id") || formData.get("employeeId");
            if (!employeeId)
                return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

            // Get existing employee data first to preserve existing data
            const existingEmployee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
            if (!existingEmployee)
                return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

            // Build update object - only update provided fields
            updateFields.modified_on = new Date();

            // Text fields - only update if provided
            const textFields = ["name", "panNumber", "password", "role", "summary"];
            textFields.forEach(key => {
                const value = formData.get(key);
                if (value !== null && value !== undefined && value !== "") {
                    updateFields[key] = value;
                }
            });

            // 🔹 Handle Experience Data with Documents - MERGE with existing
            const experienceData = parseJSON(formData.get("experience"));
            if (experienceData && Array.isArray(experienceData)) {
                const experienceWithDocs = await processExperienceDocuments(
                    formData,
                    experienceData,
                    employeeId,
                    existingEmployee.experience || []
                );
                updateFields.experience = experienceWithDocs;
            } else {
                // Preserve existing experience if no new data provided
                updateFields.experience = existingEmployee.experience;
            }

            // 🔹 Handle Education Data with Documents - MERGE with existing
            const educationData = parseJSON(formData.get("education"));
            if (educationData && Array.isArray(educationData)) {
                const educationWithDocs = await processEducationDocuments(
                    formData,
                    educationData,
                    employeeId,
                    existingEmployee.education || []
                );
                updateFields.education = educationWithDocs;
            } else {
                // Preserve existing education if no new data provided
                updateFields.education = existingEmployee.education;
            }

            // 🔹 Handle Account Details (sent as JSON string in formData)
            const rawAccountDetails = formData.get("accountDetails");
            let parsedAccountDetails = {};

            if (rawAccountDetails) {
                try {
                    parsedAccountDetails = JSON.parse(rawAccountDetails);
                } catch (err) {
                    console.warn("Invalid accountDetails JSON:", rawAccountDetails);
                    parsedAccountDetails = {};
                }
            }

            // Only update if valid object and contains data
            if (parsedAccountDetails && Object.keys(parsedAccountDetails).length > 0) {
                updateFields.accountDetails = {
                    ...existingEmployee.accountDetails,
                    ...parsedAccountDetails
                };
            } else {
                // Preserve existing account details if nothing sent
                updateFields.accountDetails = existingEmployee.accountDetails;
            }

            // 🔹 Handle profile image upload
            const file = formData.get("image");
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: "employees" },
                        (err, res) => (err ? reject(err) : resolve(res))
                    );
                    uploadStream.end(buffer);
                });
                updateFields.profileImage = result.secure_url;
            } else {
                updateFields.profileImage = existingEmployee.profileImage;
            }

            // 🔹 Handle attendance data - merge with existing
            const attendanceData = parseJSON(formData.get("attendance"));
            if (attendanceData) {
                updateFields.attendance = {
                    ...existingEmployee.attendance,
                    ...attendanceData
                };
            } else {
                updateFields.attendance = existingEmployee.attendance;
            }

            console.log("Updating fields:", Object.keys(updateFields));

            const result = await employeesCollection.updateOne(
                { _id: new ObjectId(employeeId) },
                { $set: updateFields }
            );

            if (result.matchedCount === 0)
                return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

            return new Response(JSON.stringify({
                success: true,
                message: "Profile updated successfully",
                updatedFields: Object.keys(updateFields).filter(key => key !== 'modified_on')
            }), { status: 200 });
        }

        // ✅ JSON body case (normal update or password reset)
        const body = await request.json();

        // ✅ Password reset logic
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

            await employeesCollection.updateOne(
                { _id: existingUser._id },
                { $set: { password: value.newPassword, modified_on: new Date() } }
            );

            return new Response(JSON.stringify({ success: true, message: "Password reset successful" }), { status: 200 });
        }

        // ✅ Normal JSON update request
        employeeId = body.id || body.employeeId;
        if (!employeeId)
            return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

        // Get existing employee data first to preserve existing documents
        const existingEmployee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!existingEmployee)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        updateFields.modified_on = new Date();

        // Only update provided fields, preserve others
        const allowedFields = [
            "name", "email", "panNumber", "password", "role", "summary",
            "experience", "education", "attendance", "designation", "ctc",
            "dateOfJoining", "dateOfBirth", "gender", "mobile", "department"
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined && body[field] !== null) {
                updateFields[field] = body[field];
            } else {
                // Preserve existing field if not provided
                updateFields[field] = existingEmployee[field];
            }
        });

        // 🔹 Handle Experience - preserve document URLs and merge with existing
        if (body.experience && Array.isArray(body.experience)) {
            updateFields.experience = body.experience.map((newExp, index) => {
                const existingExp = existingEmployee.experience?.[index];
                // If we have existing experience at this index, merge with new data
                if (existingExp) {
                    return {
                        ...existingExp, // Start with existing data
                        ...newExp, // Override with new data
                        documentUrl: newExp.documentUrl || existingExp.documentUrl, // Preserve existing document URL if new one not provided
                        logo: newExp.logo || existingExp.logo || dummyLogos[index % dummyLogos.length],
                        showDescription: newExp.showDescription !== undefined ? newExp.showDescription : existingExp.showDescription
                    };
                } else {
                    // New experience entry
                    return {
                        ...newExp,
                        logo: newExp.logo || dummyLogos[index % dummyLogos.length],
                        showDescription: newExp.showDescription || false
                    };
                }
            });
        } else {
            updateFields.experience = existingEmployee.experience;
        }

        // 🔹 Handle Education - preserve document URLs and merge with existing
        if (body.education && Array.isArray(body.education)) {
            updateFields.education = body.education.map((newEdu, index) => {
                const existingEdu = existingEmployee.education?.[index];
                // If we have existing education at this index, merge with new data
                if (existingEdu) {
                    return {
                        ...existingEdu, // Start with existing data
                        ...newEdu, // Override with new data
                        documentUrl: newEdu.documentUrl || existingEdu.documentUrl, // Preserve existing document URL if new one not provided
                        years: newEdu.years || `${newEdu.startYear || ''} - ${newEdu.endYear || ''}` || existingEdu.years
                    };
                } else {
                    // New education entry
                    return {
                        ...newEdu,
                        years: newEdu.years || `${newEdu.startYear || ''} - ${newEdu.endYear || ''}`
                    };
                }
            });
        } else {
            updateFields.education = existingEmployee.education;
        }

        // 🔹 Handle Account Details - merge with existing
        if (body.accountDetails) {
            updateFields.accountDetails = {
                ...existingEmployee.accountDetails,
                ...body.accountDetails
            };
        } else {
            updateFields.accountDetails = existingEmployee.accountDetails;
        }

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        return new Response(JSON.stringify({
            success: true,
            message: "Profile updated successfully",
            updatedFields: Object.keys(updateFields).filter(key => key !== 'modified_on')
        }), { status: 200 });

    } catch (err) {
        console.error("PUT /api/employees error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

/* ----------------------------------------------------------
   🧾 Document Processing Helper Functions
---------------------------------------------------------- */

// Helper function to process experience documents
async function processExperienceDocuments(formData, experienceData, employeeId, existingExperience) {
    const experienceWithDocs = [];

    for (let i = 0; i < Math.max(experienceData.length, existingExperience.length); i++) {
        const newExp = experienceData[i] || {};
        const existingExp = existingExperience[i] || {};

        let documentUrl = existingExp.documentUrl;

        // Check if there's a new document file for this experience entry
        const docFile = formData.get(`experienceDoc_${i}`);
        if (docFile && docFile.size > 0) {
            console.log(`Uploading experience document for index ${i}`);

            const buffer = Buffer.from(await docFile.arrayBuffer());
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `employees/${employeeId}/experience`,
                        resource_type: 'raw',
                        public_id: `exp_${i}_${Date.now()}`,
                    },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                uploadStream.end(buffer);
            });
            documentUrl = result.secure_url;
            console.log(`Experience document uploaded: ${documentUrl}`);
        }

        // Merge existing data with new data, preserving important fields
        const mergedExperience = {
            ...existingExp, // Start with existing data
            ...newExp, // Override with new data
            documentUrl: documentUrl, // Use new URL if uploaded, otherwise keep existing
            logo: newExp.logo || existingExp.logo || dummyLogos[i % dummyLogos.length],
            showDescription: newExp.showDescription !== undefined ? newExp.showDescription : (existingExp.showDescription || false)
        };

        experienceWithDocs.push(mergedExperience);
    }

    return experienceWithDocs;
}

// Helper function to process education documents
async function processEducationDocuments(formData, educationData, employeeId, existingEducation) {
    const educationWithDocs = [];

    for (let i = 0; i < Math.max(educationData.length, existingEducation.length); i++) {
        const newEdu = educationData[i] || {};
        const existingEdu = existingEducation[i] || {};

        let documentUrl = existingEdu.documentUrl;

        // Check if there's a new document file for this education entry
        const docFile = formData.get(`educationDoc_${i}`);
        if (docFile && docFile.size > 0) {
            console.log(`Uploading education document for index ${i}`);

            const buffer = Buffer.from(await docFile.arrayBuffer());
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `employees/${employeeId}/education`,
                        resource_type: 'raw',
                        public_id: `edu_${i}_${Date.now()}`,
                    },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                uploadStream.end(buffer);
            });
            documentUrl = result.secure_url;
            console.log(`Education document uploaded: ${documentUrl}`);
        }

        // Merge existing data with new data, preserving important fields
        const mergedEducation = {
            ...existingEdu, // Start with existing data
            ...newEdu, // Override with new data
            documentUrl: documentUrl, // Use new URL if uploaded, otherwise keep existing
            years: newEdu.years || `${newEdu.startYear || ''} - ${newEdu.endYear || ''}` || existingEdu.years
        };

        educationWithDocs.push(mergedEducation);
    }

    return educationWithDocs;
}

export async function DELETE(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection("employees");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const index = parseInt(searchParams.get("index"));

        if (!id) {
            return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
        }

        if (index === null || index === undefined) {
            return NextResponse.json({ error: "Education index is required" }, { status: 400 });
        }

        // Get the current employee data
        const employee = await employeesCollection.findOne({ _id: new ObjectId(id) });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Check if education array exists and index is valid
        if (!employee.education || index >= employee.education.length) {
            return NextResponse.json({ error: "Education entry not found" }, { status: 404 });
        }

        // Remove the specific education entry
        const updatedEducation = employee.education.filter((_, i) => i !== index);

        // Update the employee document
        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    education: updatedEducation,
                    modified_on: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: "Failed to delete education" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Education deleted successfully",
            education: updatedEducation
        });

    } catch (err) {
        console.error("DELETE /api/employees/education error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}