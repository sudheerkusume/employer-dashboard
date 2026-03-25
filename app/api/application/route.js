// app/api/application/route.js
import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";

// --- Joi Schema for Application Form ---
const applicationSchema = Joi.object({
    // Personal Information
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    address: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).required(),
    bankName: Joi.string().min(3).max(100).required(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    bankCity: Joi.string().min(2).max(50).required(),

    // Referrer Information
    referrerName: Joi.string().min(2).max(100).allow(""),
    referrerSignature: Joi.string().min(2).max(100).allow(""),

    // Declaration
    declaration: Joi.boolean().valid(true).required(),

    // Metadata
    status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
    appliedAt: Joi.date().default(Date.now),
});

const updateApplicationSchema = Joi.object({
    applicationId: Joi.string().required(),
    // Personal Information
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    address: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).required(),
    bankName: Joi.string().min(3).max(100).required(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    bankCity: Joi.string().min(2).max(50).required(),

    // Referrer Information
    referrerName: Joi.string().min(2).max(100).allow(""),
    referrerSignature: Joi.string().min(2).max(100).allow(""),

    // Declaration
    declaration: Joi.boolean().valid(true).required(),

    // Metadata
    status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
});

const updateStatusSchema = Joi.object({
    applicationId: Joi.string().required(),
    status: Joi.string().valid("pending", "approved", "rejected").required(),
    remarks: Joi.string().allow(""),
});

// ✅ POST: Submit new application
export async function POST(req) {
    try {
        const body = await req.json();

        // Validate the incoming data
        const { error, value } = applicationSchema.validate(body);
        if (error) {
            return Response.json({
                error: error.details[0].message,
                success: false
            }, { status: 400 });
        }

        const {
            fullName,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            nameAsPerBank,
            bankName,
            accountNo,
            ifscCode,
            branch,
            bankCity,
            referrerName,
            referrerSignature,
            declaration,
            status,
            appliedAt,
        } = value;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Check if email already exists
        const existingApplication = await applications.findOne({ "personalInfo.email": email });
        if (existingApplication) {
            return Response.json({
                error: "An application with this email already exists",
                success: false
            }, { status: 409 });
        }

        // Check if phone already exists
        const existingPhone = await applications.findOne({ "personalInfo.phone": phone });
        if (existingPhone) {
            return Response.json({
                error: "An application with this phone number already exists",
                success: false
            }, { status: 409 });
        }

        // Create new application document
        const newApplication = {
            _id: new ObjectId(),
            personalInfo: {
                fullName,
                email,
                phone,
                address,
                city,
                state,
                pincode,
            },
            bankDetails: {
                nameAsPerBank,
                bankName,
                accountNo,
                ifscCode,
                branch,
                bankCity,
            },
            referrerInfo: {
                referrerName: referrerName || "",
                referrerSignature: referrerSignature || "",
            },
            declaration: declaration,
            status: status || "pending",
            appliedAt: appliedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            remarks: "",
        };

        await applications.insertOne(newApplication);

        // Remove sensitive bank account number from response
        const responseData = {
            ...newApplication,
            bankDetails: {
                ...newApplication.bankDetails,
                accountNo: "****" + newApplication.bankDetails.accountNo.slice(-4),
            },
        };

        return Response.json({
            success: true,
            message: "Application submitted successfully",
            applicationId: newApplication._id,
            application: responseData,
        });

    } catch (err) {
        console.error("❌ Error submitting application:", err);
        return Response.json({
            error: "Internal Server Error",
            success: false
        }, { status: 500 });
    }
}

// ✅ GET: Fetch applications (with optional filters)
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const applicationId = url.searchParams.get("id");
        const email = url.searchParams.get("email");
        const phone = url.searchParams.get("phone");
        const status = url.searchParams.get("status");
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 10;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Fetch single application by ID
        if (applicationId) {
            const application = await applications.findOne({
                _id: new ObjectId(applicationId)
            });

            if (!application) {
                return Response.json({
                    error: "Application not found",
                    success: false
                }, { status: 404 });
            }

            // Return full application for editing (no masking)
            return Response.json({
                success: true,
                application: application,
            });
        }

        // Build filter query
        const filter = {};
        if (email) filter["personalInfo.email"] = email;
        if (phone) filter["personalInfo.phone"] = phone;
        if (status) filter.status = status;

        // Fetch applications with pagination
        const skip = (page - 1) * limit;
        const total = await applications.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const results = await applications
            .find(filter)
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Mask bank account numbers in list results only
        const maskedResults = results.map(app => ({
            ...app,
            bankDetails: {
                ...app.bankDetails,
                accountNo: "****" + app.bankDetails.accountNo.slice(-4),
            },
        }));

        return Response.json({
            success: true,
            applications: maskedResults,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords: total,
                limit,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });

    } catch (err) {
        console.error("❌ Error fetching applications:", err);
        return Response.json({
            error: "Internal Server Error",
            success: false
        }, { status: 500 });
    }
}

// ✅ PUT: Update application (full update or status update)
export async function PUT(req) {
    try {
        const body = await req.json();

        // Check if it's a status update or full application update
        if (body.applicationId && body.status && !body.fullName) {
            // Status update
            const { error, value } = updateStatusSchema.validate(body);
            if (error) {
                return Response.json({
                    error: error.details[0].message,
                    success: false
                }, { status: 400 });
            }

            const { applicationId, status, remarks } = value;

            const client = await clientPromise;
            const db = client.db(process.env.MONGODB_DBNAME);
            const applications = db.collection("marketing_applications");

            // Check if application exists
            const application = await applications.findOne({
                _id: new ObjectId(applicationId)
            });

            if (!application) {
                return Response.json({
                    error: "Application not found",
                    success: false
                }, { status: 404 });
            }

            // Update application status
            const updateResult = await applications.updateOne(
                { _id: new ObjectId(applicationId) },
                {
                    $set: {
                        status: status,
                        remarks: remarks || application.remarks,
                        updatedAt: new Date().toISOString(),
                        reviewedAt: new Date().toISOString(),
                    },
                }
            );

            if (updateResult.modifiedCount === 0) {
                return Response.json({
                    error: "Failed to update application status",
                    success: false
                }, { status: 400 });
            }

            return Response.json({
                success: true,
                message: "Application status updated successfully",
                applicationId: applicationId,
                status: status,
                remarks: remarks,
            });
        }
        else {
            // Full application update
            const { error, value } = updateApplicationSchema.validate(body);
            if (error) {
                return Response.json({
                    error: error.details[0].message,
                    success: false
                }, { status: 400 });
            }

            const {
                applicationId,
                fullName,
                email,
                phone,
                address,
                city,
                state,
                pincode,
                nameAsPerBank,
                bankName,
                accountNo,
                ifscCode,
                branch,
                bankCity,
                referrerName,
                referrerSignature,
                declaration,
                status,
            } = value;

            const client = await clientPromise;
            const db = client.db(process.env.MONGODB_DBNAME);
            const applications = db.collection("marketing_applications");

            // Check if application exists
            const application = await applications.findOne({
                _id: new ObjectId(applicationId)
            });

            if (!application) {
                return Response.json({
                    error: "Application not found",
                    success: false
                }, { status: 404 });
            }

            // Check if email already exists for another application
            if (email !== application.personalInfo.email) {
                const existingEmail = await applications.findOne({
                    "personalInfo.email": email,
                    _id: { $ne: new ObjectId(applicationId) }
                });
                if (existingEmail) {
                    return Response.json({
                        error: "An application with this email already exists",
                        success: false
                    }, { status: 409 });
                }
            }

            // Check if phone already exists for another application
            if (phone !== application.personalInfo.phone) {
                const existingPhone = await applications.findOne({
                    "personalInfo.phone": phone,
                    _id: { $ne: new ObjectId(applicationId) }
                });
                if (existingPhone) {
                    return Response.json({
                        error: "An application with this phone number already exists",
                        success: false
                    }, { status: 409 });
                }
            }

            // Update full application
            const updateData = {
                personalInfo: {
                    fullName,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    pincode,
                },
                bankDetails: {
                    nameAsPerBank,
                    bankName,
                    accountNo,
                    ifscCode,
                    branch,
                    bankCity,
                },
                referrerInfo: {
                    referrerName: referrerName || "",
                    referrerSignature: referrerSignature || "",
                },
                declaration: declaration,
                status: status || application.status,
                updatedAt: new Date().toISOString(),
            };

            const updateResult = await applications.updateOne(
                { _id: new ObjectId(applicationId) },
                { $set: updateData }
            );

            if (updateResult.modifiedCount === 0) {
                return Response.json({
                    error: "Failed to update application",
                    success: false
                }, { status: 400 });
            }

            return Response.json({
                success: true,
                message: "Application updated successfully",
                applicationId: applicationId,
            });
        }

    } catch (err) {
        console.error("❌ Error updating application:", err);
        return Response.json({
            error: "Internal Server Error",
            success: false
        }, { status: 500 });
    }
}

// ✅ DELETE: Delete an application (admin only)
export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        const applicationId = url.searchParams.get("id");

        if (!applicationId) {
            return Response.json({
                error: "Application ID is required",
                success: false
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Check if application exists
        const application = await applications.findOne({
            _id: new ObjectId(applicationId)
        });

        if (!application) {
            return Response.json({
                error: "Application not found",
                success: false
            }, { status: 404 });
        }

        // Delete the application
        const deleteResult = await applications.deleteOne({
            _id: new ObjectId(applicationId)
        });

        if (deleteResult.deletedCount === 0) {
            return Response.json({
                error: "Failed to delete application",
                success: false
            }, { status: 400 });
        }

        return Response.json({
            success: true,
            message: "Application deleted successfully",
            applicationId: applicationId,
        });

    } catch (err) {
        console.error("❌ Error deleting application:", err);
        return Response.json({
            error: "Internal Server Error",
            success: false
        }, { status: 500 });
    }
}