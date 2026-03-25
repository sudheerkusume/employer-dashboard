// app/api/application/route.js
import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";

// --- Joi Schema for Application Form ---
const applicationSchema = Joi.object({
    // Personal Details
    applicationId: Joi.string().allow(""),
    fullName: Joi.string().min(2).max(100).required(),
    dob: Joi.date().required(),
    fatherName: Joi.string().min(2).max(100).required(),
    bloodGroup: Joi.string().allow(""),
    address: Joi.string().min(5).max(200).required(),
    contactNo: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),

    // Emergency Contact Details
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().min(2).max(100).required(),
            location: Joi.string().min(2).max(100).required(),
            phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
            relationship: Joi.string().min(2).max(50).required(),
        })
    ).min(1).required(),

    // Previous Employment Details
    previousCompany: Joi.string().allow(""),
    previousDesignation: Joi.string().allow(""),
    educationalQualification: Joi.string().allow(""),

    // Legal Cases
    legalCasesPending: Joi.string().valid("yes", "no").required(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).required(),
    bankName: Joi.string().min(3).max(100).required(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    bankCity: Joi.string().min(2).max(50).required(),

    // Declaration
    declarationNote: Joi.string().allow(""),
    declaration: Joi.boolean().valid(true).required(),

    // Digital Signatures
    applicantSignature: Joi.string().optional(),
    referrerSignature: Joi.string().optional(),
    // Metadata
    status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
    appliedAt: Joi.date().default(Date.now),
});

const updateApplicationSchema = Joi.object({
    applicationId: Joi.string().required(),
    // Personal Details
    applicationId: Joi.string().allow(""),
    fullName: Joi.string().min(2).max(100).required(),
    dob: Joi.date().required(),
    fatherName: Joi.string().min(2).max(100).required(),
    bloodGroup: Joi.string().allow(""),
    address: Joi.string().min(5).max(200).required(),
    contactNo: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),

    // Emergency Contact Details
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().min(2).max(100).required(),
            location: Joi.string().min(2).max(100).required(),
            phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
            relationship: Joi.string().min(2).max(50).required(),
        })
    ).min(1).required(),

    // Previous Employment Details
    previousCompany: Joi.string().allow(""),
    previousDesignation: Joi.string().allow(""),
    educationalQualification: Joi.string().allow(""),

    // Legal Cases
    legalCasesPending: Joi.string().valid("yes", "no").required(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).required(),
    bankName: Joi.string().min(3).max(100).required(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    bankCity: Joi.string().min(2).max(50).required(),

    // Declaration
    declarationNote: Joi.string().allow(""),
    declaration: Joi.boolean().valid(true).required(),

    // Digital Signatures
    applicantSignature: Joi.string().optional(),
    referrerSignature: Joi.string().optional(),

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
            console.error("Validation error:", error.details[0].message);
            return Response.json({
                error: error.details[0].message,
                success: false
            }, { status: 400 });
        }

        const {
            applicationId: customAppId,
            fullName,
            dob,
            fatherName,
            bloodGroup,
            address,
            contactNo,
            email,
            pinCode,
            panNumber,
            aadharNumber,
            emergencyContacts,
            previousCompany,
            previousDesignation,
            educationalQualification,
            legalCasesPending,
            nameAsPerBank,
            bankName,
            accountNo,
            ifscCode,
            branch,
            bankCity,
            declarationNote,
            declaration,
            applicantSignature,
            referrerSignature,
            status,
            appliedAt,
        } = value;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Check if email already exists
        const existingApplication = await applications.findOne({ email: email });
        if (existingApplication) {
            return Response.json({
                error: "An application with this email already exists",
                success: false
            }, { status: 409 });
        }

        // Check if phone already exists
        const existingPhone = await applications.findOne({ contactNo: contactNo });
        if (existingPhone) {
            return Response.json({
                error: "An application with this phone number already exists",
                success: false
            }, { status: 409 });
        }

        // Check if PAN already exists
        const existingPan = await applications.findOne({ panNumber: panNumber });
        if (existingPan) {
            return Response.json({
                error: "An application with this PAN number already exists",
                success: false
            }, { status: 409 });
        }

        // Check if Aadhar already exists
        const existingAadhar = await applications.findOne({ aadharNumber: aadharNumber });
        if (existingAadhar) {
            return Response.json({
                error: "An application with this Aadhar number already exists",
                success: false
            }, { status: 409 });
        }

        // Generate application ID if not provided
        const generatedAppId = customAppId || `APP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        // Create new application document
        const newApplication = {
            _id: new ObjectId(),
            applicationId: generatedAppId,
            fullName,
            dob: new Date(dob).toISOString(),
            fatherName,
            bloodGroup: bloodGroup || "",
            address,
            contactNo,
            email,
            pinCode,
            panNumber,
            aadharNumber,
            emergencyContacts: emergencyContacts.map(contact => ({
                ...contact,
                _id: new ObjectId()
            })),
            previousCompany: previousCompany || "",
            previousDesignation: previousDesignation || "",
            educationalQualification: educationalQualification || "",
            legalCasesPending,
            nameAsPerBank,
            bankName,
            accountNo,
            ifscCode,
            branch,
            bankCity,
            declarationNote: declarationNote || "",
            declaration,
            applicantSignature,
            referrerSignature,
            status: status || "pending",
            appliedAt: appliedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            remarks: "",
        };

        await applications.insertOne(newApplication);

        // Remove sensitive data from response
        const responseData = {
            ...newApplication,
            accountNo: "****" + newApplication.accountNo.slice(-4),
            aadharNumber: "****" + newApplication.aadharNumber.slice(-4),
            panNumber: "****" + newApplication.panNumber.slice(-4),
            applicantSignature: "[SIGNATURE]",
            referrerSignature: "[SIGNATURE]",
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
        if (email) filter.email = email;
        if (phone) filter.contactNo = phone;
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

        // Mask sensitive data in list results only
        const maskedResults = results.map(app => ({
            ...app,
            accountNo: "****" + app.accountNo.slice(-4),
            aadharNumber: "****" + app.aadharNumber.slice(-4),
            panNumber: "****" + app.panNumber.slice(-4),
            applicantSignature: "[SIGNATURE]",
            referrerSignature: "[SIGNATURE]",
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
                dob,
                fatherName,
                bloodGroup,
                address,
                contactNo,
                email,
                pinCode,
                panNumber,
                aadharNumber,
                emergencyContacts,
                previousCompany,
                previousDesignation,
                educationalQualification,
                legalCasesPending,
                nameAsPerBank,
                bankName,
                accountNo,
                ifscCode,
                branch,
                bankCity,
                declarationNote,
                declaration,
                applicantSignature,
                referrerSignature,
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
            if (email !== application.email) {
                const existingEmail = await applications.findOne({
                    email: email,
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
            if (contactNo !== application.contactNo) {
                const existingPhone = await applications.findOne({
                    contactNo: contactNo,
                    _id: { $ne: new ObjectId(applicationId) }
                });
                if (existingPhone) {
                    return Response.json({
                        error: "An application with this phone number already exists",
                        success: false
                    }, { status: 409 });
                }
            }

            // Check if PAN already exists for another application
            if (panNumber !== application.panNumber) {
                const existingPan = await applications.findOne({
                    panNumber: panNumber,
                    _id: { $ne: new ObjectId(applicationId) }
                });
                if (existingPan) {
                    return Response.json({
                        error: "An application with this PAN number already exists",
                        success: false
                    }, { status: 409 });
                }
            }

            // Check if Aadhar already exists for another application
            if (aadharNumber !== application.aadharNumber) {
                const existingAadhar = await applications.findOne({
                    aadharNumber: aadharNumber,
                    _id: { $ne: new ObjectId(applicationId) }
                });
                if (existingAadhar) {
                    return Response.json({
                        error: "An application with this Aadhar number already exists",
                        success: false
                    }, { status: 409 });
                }
            }

            // Update full application
            const updateData = {
                fullName,
                dob: new Date(dob).toISOString(),
                fatherName,
                bloodGroup: bloodGroup || "",
                address,
                contactNo,
                email,
                pinCode,
                panNumber,
                aadharNumber,
                emergencyContacts: emergencyContacts.map(contact => ({
                    ...contact,
                    _id: contact._id || new ObjectId()
                })),
                previousCompany: previousCompany || "",
                previousDesignation: previousDesignation || "",
                educationalQualification: educationalQualification || "",
                legalCasesPending,
                nameAsPerBank,
                bankName,
                accountNo,
                ifscCode,
                branch,
                bankCity,
                declarationNote: declarationNote || "",
                declaration,
                applicantSignature,
                referrerSignature,
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