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
    reportingManager: Joi.string(),
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
        const includeInactive = searchParams.get("includeInactive") === "true";

        let query = {};
        if (!includeInactive) {
            query.isActive = { $ne: false }; // only active employees
        }

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
            query.name = { $regex: name, $options: "i" };
            const employees = await employeesCollection.find(query).toArray();
            return Response.json(employees);
        }

        // 🔹 Return all employees (filtered by isActive)
        const employees = await employeesCollection.find(query).toArray();
        return Response.json(employees);
    } catch (error) {
        console.log("GET /api/employees error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// --- Generate next Employee Code based on department ---
function generateNextCode(latestNum, department) {
    let prefix = "SEZ";
    switch ((department || "").toLowerCase()) {
        case "tech":
            prefix = "SEZT";
            break;
        case "sales":
            prefix = "SEZS";
            break;
        case "admin":
            prefix = "SEZA";
            break;
        default:
            prefix = "SEZ";
    }
    const nextNum = (latestNum || 0) + 1;
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function POST(request) {
    try {
        const body = await request.json();

        const { error, value } = employeeSchema.validate(body);
        if (error)
            return new Response(JSON.stringify({ error: error.details[0].message }), { status: 400 });

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employees = db.collection("employees");

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

        const newCode = generateNextCode(latestNum, value.department);

        const newEmployee = {
            ...value,
            employeeCode: newCode,
            createdAt: new Date(),
            modified_on: new Date(),
            attendance: {},
            accountDetails: {},
            isActive: true,           // ✅ Active by default
        };

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
        console.log("❌ Error adding employee:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
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

            const existingEmployee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
            if (!existingEmployee)
                return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

            updateFields.modified_on = new Date();

            const textFields = [
                "name", "email", "mobile", "gender", "password", "summary", "reportingManager",
                "panNumber", "aadhaarNumber", "designation", "department",
                "employeeCode", "ctc", "regime", "isActive"
            ];
            textFields.forEach(key => {
                const value = formData.get(key);
                if (value !== null && value !== undefined && value !== "") {
                    updateFields[key] = value;
                }
            });

            // Experience & Education processing (same as before)
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
                updateFields.experience = existingEmployee.experience;
            }

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
                updateFields.education = existingEmployee.education;
            }

            // Account details
            const rawAccountDetails = formData.get("accountDetails");
            let parsedAccountDetails = {};
            if (rawAccountDetails) {
                try {
                    parsedAccountDetails = JSON.parse(rawAccountDetails);
                } catch (err) {
                    console.warn("Invalid accountDetails JSON:", rawAccountDetails);
                }
            }
            if (parsedAccountDetails && Object.keys(parsedAccountDetails).length > 0) {
                updateFields.accountDetails = {
                    ...existingEmployee.accountDetails,
                    ...parsedAccountDetails
                };
            } else {
                updateFields.accountDetails = existingEmployee.accountDetails;
            }

            // Profile image upload
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

            // Attendance merge
            const attendanceData = parseJSON(formData.get("attendance"));
            if (attendanceData) {
                updateFields.attendance = {
                    ...existingEmployee.attendance,
                    ...attendanceData
                };
            } else {
                updateFields.attendance = existingEmployee.attendance;
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
        }

        // ✅ JSON body case
        const body = await request.json();

        // Password reset logic
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

        // Normal JSON update (including isActive toggle)
        employeeId = body.id || body.employeeId;
        if (!employeeId)
            return new Response(JSON.stringify({ error: "Employee ID required" }), { status: 400 });

        const existingEmployee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!existingEmployee)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        updateFields.modified_on = new Date();

        const allowedFields = [
            "name", "email", "panNumber", "password", "role", "summary",
            "experience", "education", "attendance", "designation", "ctc",
            "dateOfJoining", "dateOfBirth", "gender", "mobile", "department", "leaves",
            "reportingId", "reportingManager"
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined && body[field] !== null) {
                updateFields[field] = body[field];
            } else {
                updateFields[field] = existingEmployee[field];
            }
        });

        // Experience & Education merging (preserve docs)
        if (body.experience && Array.isArray(body.experience)) {
            updateFields.experience = body.experience.map((newExp, index) => {
                const existingExp = existingEmployee.experience?.[index];
                if (existingExp) {
                    return {
                        ...existingExp,
                        ...newExp,
                        documentUrl: newExp.documentUrl || existingExp.documentUrl,
                        logo: newExp.logo || existingExp.logo || dummyLogos[index % dummyLogos.length],
                    };
                } else {
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

        if (body.education && Array.isArray(body.education)) {
            updateFields.education = body.education.map((newEdu, index) => {
                const existingEdu = existingEmployee.education?.[index];
                if (existingEdu) {
                    return {
                        ...existingEdu,
                        ...newEdu,
                        documentUrl: newEdu.documentUrl || existingEdu.documentUrl,
                        years: newEdu.years || `${newEdu.startYear || ''} - ${newEdu.endYear || ''}` || existingEdu.years
                    };
                } else {
                    return {
                        ...newEdu,
                        years: newEdu.years || `${newEdu.startYear || ''} - ${newEdu.endYear || ''}`
                    };
                }
            });
        } else {
            updateFields.education = existingEmployee.education;
        }

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

        // 🔹 Sync leave status changes to the actual employee's attendance
        if (body.leaves && Array.isArray(body.leaves)) {
            const existingLeaves = existingEmployee.leaves || [];

            for (let i = 0; i < body.leaves.length; i++) {
                const updatedLeave = body.leaves[i];
                const existingLeave = existingLeaves[i];

                // If status changed (e.g. pending -> approved/rejected)
                if (existingLeave && existingLeave.status !== updatedLeave.status && updatedLeave.employeeId) {
                    const targetEmployeeId = updatedLeave.employeeId;
                    try {
                        const targetEmployee = await employeesCollection.findOne({ _id: new ObjectId(targetEmployeeId) });

                        if (targetEmployee && targetEmployee.attendance) {
                            let attendanceUpdated = false;

                            // Go through all months in attendance
                            for (const month in targetEmployee.attendance) {
                                const monthData = targetEmployee.attendance[month];

                                // Go through all attendance records in that month
                                for (let j = 0; j < monthData.length; j++) {
                                    const record = monthData[j];

                                    // Match the leave based on leave dates
                                    if (updatedLeave.leaveDates && Array.isArray(updatedLeave.leaveDates) && updatedLeave.leaveDates.includes(record.date)) {
                                        record.status = updatedLeave.status;
                                        attendanceUpdated = true;
                                    }
                                }
                            }

                            if (attendanceUpdated) {
                                await employeesCollection.updateOne(
                                    { _id: new ObjectId(targetEmployeeId) },
                                    { $set: { attendance: targetEmployee.attendance } }
                                );
                            }
                        }
                    } catch (syncErr) {
                        console.log("Error syncing leave status to employee:", syncErr);
                    }
                }
            }
        }

        if (result.matchedCount === 0)
            return new Response(JSON.stringify({ error: "Employee not found" }), { status: 404 });

        return new Response(JSON.stringify({
            success: true,
            message: "Profile updated successfully",
            updatedFields: Object.keys(updateFields).filter(key => key !== 'modified_on')
        }), { status: 200 });

    } catch (err) {
        console.log("PUT /api/employees error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Document processing helpers (unchanged)
async function processExperienceDocuments(formData, experienceData, employeeId, existingExperience) {
    const experienceWithDocs = [];
    for (let i = 0; i < Math.max(experienceData.length, existingExperience.length); i++) {
        const newExp = experienceData[i] || {};
        const existingExp = existingExperience[i] || {};
        let documentUrl = existingExp.documentUrl;
        const docFile = formData.get(`experienceDoc_${i}`);
        if (docFile && docFile.size > 0) {
            const buffer = Buffer.from(await docFile.arrayBuffer());
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: `employees/${employeeId}/experience`, resource_type: 'raw', public_id: `exp_${i}_${Date.now()}` },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                uploadStream.end(buffer);
            });
            documentUrl = result.secure_url;
        }
        const mergedExperience = {
            ...existingExp,
            ...newExp,
            documentUrl,
            logo: newExp.logo || existingExp.logo || dummyLogos[i % dummyLogos.length],
            showDescription: newExp.showDescription !== undefined ? newExp.showDescription : (existingExp.showDescription || false)
        };
        experienceWithDocs.push(mergedExperience);
    }
    return experienceWithDocs;
}

async function processEducationDocuments(formData, educationData, employeeId, existingEducation) {
    const educationWithDocs = [];
    for (let i = 0; i < Math.max(educationData.length, existingEducation.length); i++) {
        const newEdu = educationData[i] || {};
        const existingEdu = existingEducation[i] || {};
        let documentUrl = existingEdu.documentUrl;
        const docFile = formData.get(`educationDoc_${i}`);
        if (docFile && docFile.size > 0) {
            const buffer = Buffer.from(await docFile.arrayBuffer());
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: `employees/${employeeId}/education`, resource_type: 'raw', public_id: `edu_${i}_${Date.now()}` },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                uploadStream.end(buffer);
            });
            documentUrl = result.secure_url;
        }
        const mergedEducation = {
            ...existingEdu,
            ...newEdu,
            documentUrl,
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
        const index = Number(searchParams.get("index"));
        const type = searchParams.get("type");
        const deleteType = searchParams.get("deleteType") || "entry";

        // Case: Delete an experience or education entry (preserve employee)
        if (type && ["experience", "education"].includes(type) && !isNaN(index)) {
            if (!id) return Response.json({ error: "Employee ID required" }, { status: 400 });

            const employee = await employeesCollection.findOne({ _id: new ObjectId(id) });
            if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });
            if (!employee[type] || !Array.isArray(employee[type]))
                return Response.json({ error: `${type} data not found` }, { status: 404 });
            if (index >= employee[type].length)
                return Response.json({ error: `Invalid ${type} index` }, { status: 400 });
            const type = searchParams.get("type"); // "experience" or "education"
            const deleteType = searchParams.get("deleteType") || "entry"; // "entry" or "document"

            console.log(`DELETE Request:`, { id, index, type, deleteType });

            // Validate required parameters
            if (!id) {
                return Response.json({ error: "Employee ID is required" }, { status: 400 });
            }

            // 🔹 If no type is provided, delete the entire employee
            if (!type) {
                const deleteResult = await employeesCollection.deleteOne({ _id: new ObjectId(id) });
                if (deleteResult.deletedCount === 0) {
                    return Response.json({ error: "Employee not found" }, { status: 404 });
                }
                return Response.json({ success: true, message: "Employee deleted successfully" });
            }

            if (!["experience", "education"].includes(type)) {
                return Response.json({ error: "Type must be 'experience' or 'education'" }, { status: 400 });
            }

            if (isNaN(index) || index < 0) {
                return Response.json({ error: "Valid index is required" }, { status: 400 });
            }

            // Find employee
            const employee = await employeesCollection.findOne({ _id: new ObjectId(id) });
            if (!employee) {
                return Response.json({ error: "Employee not found" }, { status: 404 });
            }

            // Validate the array exists
            if (!employee[type] || !Array.isArray(employee[type])) {
                return Response.json({ error: `${type} data not found` }, { status: 404 });
            }

            // Check if index is within bounds
            if (index >= employee[type].length) {
                return Response.json({ error: `Invalid ${type} index` }, { status: 400 });
            }

            let updatedArray = [...employee[type]];
            if (deleteType === "document") {
                const itemToUpdate = updatedArray[index];
                if (itemToUpdate.documentUrl) {
                    try {
                        const urlParts = itemToUpdate.documentUrl.split('/');
                        const publicIdWithExtension = urlParts[urlParts.length - 1];
                        const publicId = publicIdWithExtension.split('.')[0];
                        const fullPublicId = `employees/${id}/${type}/${publicId}`;
                        await cloudinary.uploader.destroy(fullPublicId, { resource_type: 'raw' });
                    } catch (err) { console.warn("Cloudinary delete error:", err); }
                }
                updatedArray[index] = { ...itemToUpdate, documentUrl: "", document: null };
            } else {
                const itemToDelete = updatedArray[index];
                if (itemToDelete.documentUrl) {
                    try {
                        const urlParts = itemToDelete.documentUrl.split('/');
                        const publicIdWithExtension = urlParts[urlParts.length - 1];
                        const publicId = publicIdWithExtension.split('.')[0];
                        const fullPublicId = `employees/${id}/${type}/${publicId}`;
                        await cloudinary.uploader.destroy(fullPublicId, { resource_type: 'raw' });
                    } catch (err) { console.warn("Cloudinary delete error:", err); }
                }
                updatedArray.splice(index, 1);
            }

            const updateResult = await employeesCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        [type]: updatedArray,
                        modified_on: new Date()
                    }
                }
            );
        }

        if (updateResult.matchedCount === 0) {
            return Response.json({ error: "Employee not found during update" }, { status: 404 });
        }

        return Response.json({
            success: true,
            message: "Employee deactivated (soft delete) successfully"
        });

    } catch (err) {
        console.log("DELETE error:", err);
        if (err.message.includes("Invalid ObjectId"))
            return Response.json({ error: "Invalid employee ID format" }, { status: 400 });
        return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}