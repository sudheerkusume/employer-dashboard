// app/api/application/route.js
import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";

// --- Joi Schema for Application Form ---
const applicationSchema = Joi.object({
    // Personal Details
    applicationId: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.date().optional(),
    fatherName: Joi.string().min(2).max(100).optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().min(5).max(200).optional(),
    contactNo: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),

    // Emergency Contact Details
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().min(2).max(100).required(),
            location: Joi.string().min(2).max(100).required(),
            phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
            relationship: Joi.string().min(2).max(50).required(),
        })
    ).optional(),

    // Previous Employment Details
    previousCompany: Joi.string().allow("").optional(),
    previousDesignation: Joi.string().allow("").optional(),
    educationalQualification: Joi.string().allow("").optional(),

    // Legal Cases
    legalCasesPending: Joi.string().valid("yes", "no").optional(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).optional(),
    bankName: Joi.string().min(3).max(100).optional(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).optional(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
    branch: Joi.string().min(2).max(100).optional(),
    bankCity: Joi.string().min(2).max(50).optional(),

    // Declaration
    declarationNote: Joi.string().allow("").optional(),
    declaration: Joi.boolean().valid(true).optional(),  // If provided, must be true; otherwise ignored

    // Digital Signatures
    applicantSignature: Joi.string().allow("").optional(),
    referrerSignature: Joi.string().allow("").optional(),

    // Referred By
    referredBy: Joi.string().allow("").optional(),

    // Metadata
    status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
    appliedAt: Joi.date().default(Date.now),
});

const updateApplicationSchema = Joi.object({
    id: Joi.string().required(),  // Always required to identify the document
    // Personal Details
    applicationId: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.date().optional(),
    fatherName: Joi.string().min(2).max(100).optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().min(5).max(200).optional(),
    contactNo: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),

    // Emergency Contact Details
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().min(2).max(100).required(),
            location: Joi.string().min(2).max(100).required(),
            phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
            relationship: Joi.string().min(2).max(50).required(),
        })
    ).optional(),

    // Previous Employment Details
    previousCompany: Joi.string().allow("").optional(),
    previousDesignation: Joi.string().allow("").optional(),
    educationalQualification: Joi.string().allow("").optional(),

    // Legal Cases
    legalCasesPending: Joi.string().valid("yes", "no").optional(),

    // Bank Account Details
    nameAsPerBank: Joi.string().min(3).max(100).optional(),
    bankName: Joi.string().min(3).max(100).optional(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).optional(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
    branch: Joi.string().min(2).max(100).optional(),
    bankCity: Joi.string().min(2).max(50).optional(),

    // Declaration
    declarationNote: Joi.string().allow("").optional(),
    declaration: Joi.boolean().valid(true).optional(),

    // Digital Signatures
    applicantSignature: Joi.string().allow("").optional(),
    referrerSignature: Joi.string().allow("").optional(),

    // Referred By
    referredBy: Joi.string().allow("").optional(),

    // Metadata
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
});

const updateStatusSchema = Joi.object({
    id: Joi.string().required(),
    status: Joi.string().valid("pending", "approved", "rejected").required(),
    remarks: Joi.string().allow(""),
});

// ======================
// MLM Helpers
// ======================

// Promotion thresholds
const PROMOTION_THRESHOLDS = {
    'ME': { next: 'MM', required: 5 },
    'MM': { next: 'SMM', required: 5 },
    'SMM': { next: 'AGM', required: 5 },
    'AGM': { next: 'DGM', required: 5 },
    'DGM': { next: 'GM', required: 5 },
    'GM': { next: null, required: null }
};

async function generateUserCode(db, level) {
    const prefix = level; // e.g., "ME"
    const lastUser = await db.collection('mlm_users').findOne(
        { userCode: { $regex: `^${prefix}-\\d+$` } },
        { sort: { userCode: -1 } }
    );
    let nextNum = 1;
    if (lastUser) {
        const match = lastUser.userCode.match(/\d+$/);
        if (match) nextNum = parseInt(match[0]) + 1;
    }
    return `${prefix}-${nextNum.toString().padStart(3, '0')}`;
}

async function promoteUserIfNeeded(db, userCode) {
    const user = await db.collection('mlm_users').findOne({ userCode });
    if (!user) return false;

    const currentLevel = user.level;
    const threshold = PROMOTION_THRESHOLDS[currentLevel];
    if (!threshold || !threshold.next) return false;

    // Count direct children that are at the same level as currentLevel
    const children = await db.collection('mlm_users').find({ sponsorCode: userCode }).toArray();
    const count = children.filter(child => child.level === currentLevel).length;

    if (count >= threshold.required) {
        // Promote
        await db.collection('mlm_users').updateOne(
            { userCode },
            { $set: { level: threshold.next, updatedAt: new Date().toISOString() } }
        );
        console.log(`Promoted ${userCode} from ${currentLevel} to ${threshold.next}`);

        // Recursively check sponsor
        if (user.sponsorCode) {
            await promoteUserIfNeeded(db, user.sponsorCode);
        }
        return true;
    }
    return false;
}

async function createMlmMemberFromApplication(db, application) {
    const {
        referredBy,
        fullName,
        email,
        contactNo,
        dob,
        fatherName,
        address,
        pinCode,
        panNumber,
        aadharNumber,
        bankName,
        accountNo,
        ifscCode,
        branch,
        bankCity,
        _id: appId
    } = application;

    // Validate referrer exists in mlm_users
    if (!referredBy) {
        throw new Error('ReferredBy is required to create MLM member.');
    }
    const sponsor = await db.collection('mlm_users').findOne({ userCode: referredBy });
    if (!sponsor) {
        throw new Error(`Referrer code "${referredBy}" not found in MLM network.`);
    }

    // Generate user code for level ME
    const userCode = await generateUserCode(db, 'ME');

    // Create MLM user document
    const newMlmUser = {
        _id: new ObjectId(),
        userCode,
        sponsorCode: referredBy,
        level: 'ME',
        fullName,
        email,
        contactNo,
        dob: new Date(dob).toISOString(),
        fatherName,
        address,
        pinCode,
        panNumber,
        aadharNumber,
        bankName,
        accountNo,
        ifscCode,
        branch,
        bankCity,
        status: 'active',
        children: [],
        directChildrenCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicationId: appId,
    };

    await db.collection('mlm_users').insertOne(newMlmUser);

    // Update sponsor's children list and count
    await db.collection('mlm_users').updateOne(
        { userCode: referredBy },
        {
            $push: { children: userCode },
            $inc: { directChildrenCount: 1 },
            $set: { updatedAt: new Date().toISOString() }
        }
    );

    // Update application with generated MLM user code
    await db.collection('marketing_applications').updateOne(
        { _id: appId },
        { $set: { mlmUserCode: userCode, updatedAt: new Date().toISOString() } }
    );

    // Trigger promotion checks for sponsor
    await promoteUserIfNeeded(db, referredBy);

    return userCode;
}

// ======================
// API Routes
// ======================

// ✅ POST: Submit new application
export async function POST(req) {
    try {
        const body = await req.json();

        const { error, value } = applicationSchema.validate(body);
        if (error) {
            return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // --- Duplicate checks only if field is provided ---
        if (value.email) {
            const existingEmail = await applications.findOne({ email: value.email });
            if (existingEmail) {
                return Response.json({ error: "Email already exists", success: false }, { status: 409 });
            }
        }
        if (value.contactNo) {
            const existingPhone = await applications.findOne({ contactNo: value.contactNo });
            if (existingPhone) {
                return Response.json({ error: "Phone number already exists", success: false }, { status: 409 });
            }
        }
        if (value.panNumber) {
            const existingPan = await applications.findOne({ panNumber: value.panNumber });
            if (existingPan) {
                return Response.json({ error: "PAN number already exists", success: false }, { status: 409 });
            }
        }
        if (value.aadharNumber) {
            const existingAadhar = await applications.findOne({ aadharNumber: value.aadharNumber });
            if (existingAadhar) {
                return Response.json({ error: "Aadhar number already exists", success: false }, { status: 409 });
            }
        }

        // Generate application ID if not provided
        const generatedAppId = value.applicationId || `APP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        // Build the document: only include fields that are present
        const newApplication = {
            _id: new ObjectId(),
            applicationId: generatedAppId,
            ...(value.fullName !== undefined && { fullName: value.fullName }),
            ...(value.dob !== undefined && { dob: new Date(value.dob).toISOString() }),
            ...(value.fatherName !== undefined && { fatherName: value.fatherName }),
            ...(value.bloodGroup !== undefined && { bloodGroup: value.bloodGroup }),
            ...(value.address !== undefined && { address: value.address }),
            ...(value.contactNo !== undefined && { contactNo: value.contactNo }),
            ...(value.email !== undefined && { email: value.email }),
            ...(value.pinCode !== undefined && { pinCode: value.pinCode }),
            ...(value.panNumber !== undefined && { panNumber: value.panNumber }),
            ...(value.aadharNumber !== undefined && { aadharNumber: value.aadharNumber }),
            ...(value.emergencyContacts !== undefined && {
                emergencyContacts: value.emergencyContacts.map(contact => ({ ...contact, _id: new ObjectId() }))
            }),
            ...(value.previousCompany !== undefined && { previousCompany: value.previousCompany }),
            ...(value.previousDesignation !== undefined && { previousDesignation: value.previousDesignation }),
            ...(value.educationalQualification !== undefined && { educationalQualification: value.educationalQualification }),
            ...(value.legalCasesPending !== undefined && { legalCasesPending: value.legalCasesPending }),
            ...(value.nameAsPerBank !== undefined && { nameAsPerBank: value.nameAsPerBank }),
            ...(value.bankName !== undefined && { bankName: value.bankName }),
            ...(value.accountNo !== undefined && { accountNo: value.accountNo }),
            ...(value.ifscCode !== undefined && { ifscCode: value.ifscCode }),
            ...(value.branch !== undefined && { branch: value.branch }),
            ...(value.bankCity !== undefined && { bankCity: value.bankCity }),
            ...(value.declarationNote !== undefined && { declarationNote: value.declarationNote }),
            ...(value.declaration !== undefined && { declaration: value.declaration }),
            ...(value.applicantSignature !== undefined && { applicantSignature: value.applicantSignature }),
            ...(value.referrerSignature !== undefined && { referrerSignature: value.referrerSignature }),
            ...(value.referredBy !== undefined && { referredBy: value.referredBy }),
            status: value.status || "pending",
            appliedAt: value.appliedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            remarks: "",
            mlmUserCode: null,
        };

        await applications.insertOne(newApplication);

        // Mask sensitive data for response
        const responseData = { ...newApplication };
        if (responseData.accountNo) responseData.accountNo = "****" + responseData.accountNo.slice(-4);
        if (responseData.aadharNumber) responseData.aadharNumber = "****" + responseData.aadharNumber.slice(-4);
        if (responseData.panNumber) responseData.panNumber = "****" + responseData.panNumber.slice(-4);
        if (responseData.applicantSignature) responseData.applicantSignature = "[SIGNATURE]";
        if (responseData.referrerSignature) responseData.referrerSignature = "[SIGNATURE]";

        return Response.json({
            success: true,
            message: "Application submitted successfully",
            applicationId: newApplication._id,
            application: responseData,
        });
    } catch (err) {
        console.error("❌ Error submitting application:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
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
// ✅ PUT: Update application (status update or partial update)
export async function PUT(req) {
    try {
        const body = await req.json();

        // Connect to DB once at the start
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Check if it's a status update or full application update
        if (body.id && body.status && !body.fullName) {
            // ---------- STATUS UPDATE ----------
            const { error, value } = updateStatusSchema.validate(body);
            if (error) {
                return Response.json({
                    error: error.details[0].message,
                    success: false
                }, { status: 400 });
            }

            const { id, status, remarks } = value;

            // Check if application exists
            const application = await applications.findOne({
                _id: new ObjectId(id)
            });

            if (!application) {
                return Response.json({
                    error: "Application not found",
                    success: false
                }, { status: 404 });
            }

            // Update application status
            const updateResult = await applications.updateOne(
                { _id: new ObjectId(id) },
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

            // If status is 'approved' and no MLM user code exists yet, create MLM member
            if (status === 'approved' && !application.mlmUserCode) {
                try {
                    const mlmUserCode = await createMlmMemberFromApplication(db, application);
                    return Response.json({
                        success: true,
                        message: "Application approved and MLM member created",
                        applicationId: id,
                        status: status,
                        remarks: remarks,
                        mlmUserCode: mlmUserCode,
                    });
                } catch (mlmError) {
                    console.error("MLM creation failed:", mlmError);
                    return Response.json({
                        error: `Application approved but MLM member creation failed: ${mlmError.message}`,
                        success: false,
                    }, { status: 500 });
                }
            }

            return Response.json({
                success: true,
                message: "Application status updated successfully",
                applicationId: id,
                status: status,
                remarks: remarks,
            });
        }
        else {
            // ---------- PARTIAL APPLICATION UPDATE ----------
            const { error, value } = updateApplicationSchema.validate(body);
            if (error) {
                return Response.json({
                    error: error.details[0].message,
                    success: false
                }, { status: 400 });
            }

            const { id, ...updateFields } = value;

            // Remove undefined fields so they are not overwritten with null/empty
            const filteredUpdate = {};
            for (const [key, val] of Object.entries(updateFields)) {
                if (val !== undefined) {
                    filteredUpdate[key] = val;
                }
            }

            // If no fields to update except id, return early
            if (Object.keys(filteredUpdate).length === 0) {
                return Response.json({ error: "No fields to update", success: false }, { status: 400 });
            }

            // Convert special fields
            if (filteredUpdate.dob) {
                filteredUpdate.dob = new Date(filteredUpdate.dob).toISOString();
            }
            if (filteredUpdate.emergencyContacts) {
                filteredUpdate.emergencyContacts = filteredUpdate.emergencyContacts.map(contact => ({
                    ...contact,
                    _id: contact._id || new ObjectId()
                }));
            }

            // Check duplicates only if fields are being changed
            if (filteredUpdate.email) {
                const existingEmail = await applications.findOne({
                    email: filteredUpdate.email,
                    _id: { $ne: new ObjectId(id) }
                });
                if (existingEmail) {
                    return Response.json({ error: "Email already exists", success: false }, { status: 409 });
                }
            }
            if (filteredUpdate.contactNo) {
                const existingPhone = await applications.findOne({
                    contactNo: filteredUpdate.contactNo,
                    _id: { $ne: new ObjectId(id) }
                });
                if (existingPhone) {
                    return Response.json({ error: "Phone already exists", success: false }, { status: 409 });
                }
            }
            if (filteredUpdate.panNumber) {
                const existingPan = await applications.findOne({
                    panNumber: filteredUpdate.panNumber,
                    _id: { $ne: new ObjectId(id) }
                });
                if (existingPan) {
                    return Response.json({ error: "PAN already exists", success: false }, { status: 409 });
                }
            }
            if (filteredUpdate.aadharNumber) {
                const existingAadhar = await applications.findOne({
                    aadharNumber: filteredUpdate.aadharNumber,
                    _id: { $ne: new ObjectId(id) }
                });
                if (existingAadhar) {
                    return Response.json({ error: "Aadhar already exists", success: false }, { status: 409 });
                }
            }

            filteredUpdate.updatedAt = new Date().toISOString();

            const updateResult = await applications.updateOne(
                { _id: new ObjectId(id) },
                { $set: filteredUpdate }
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
                applicationId: value.applicationId || id,
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