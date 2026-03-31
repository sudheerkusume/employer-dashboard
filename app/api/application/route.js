// app/api/application/route.js
import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";
import nodemailer from "nodemailer";

// --- Email helper (used in POST and PUT) ---
async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `"Real Beez Projects Pvt Ltd" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

// ======================
// ATOMIC COUNTER HELPERS (thread‑safe)
// ======================

/**
 * Get the next sequential application ID (e.g., RB000001, RB000002, ...)
 * Uses a dedicated counters collection to ensure uniqueness even under high concurrency.
 */
async function getNextApplicationId(db) {
    const counters = db.collection("counters");
    const result = await counters.findOneAndUpdate(
        { _id: "applicationId" },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );
    const seq = result.value.seq;
    return `RB${seq.toString().padStart(6, '0')}`;
}

/**
 * Get the next user code for a given level (e.g., ME-001, ME-002, ...)
 * Atomic and level‑specific.
 */
async function getNextUserCode(db, level) {
    const counters = db.collection("counters");
    const counterId = `userCode_${level}`;
    const result = await counters.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );
    const seq = result.value.seq;
    return `${level}-${seq.toString().padStart(3, '0')}`;
}


// ======================
// MLM Helpers
// ======================
const PROMOTION_THRESHOLDS = {
    'ME': { next: 'MM', required: 5 },
    'MM': { next: 'SMM', required: 5 },
    'SMM': { next: 'AGM', required: 5 },
    'AGM': { next: 'DGM', required: 5 },
    'DGM': { next: 'GM', required: 5 },
    'GM': { next: null, required: null }
};

const TARGETS = {
    'ME': 300000,
    'MM': 1000000,
    'SMM': 3500000,
    'AGM': 10000000,
    'DGM': 20000000,
    'GM': 50000000
};

async function generateUserCode(db, level) {
    const prefix = level; // e.g., "ME"
    const lastUser = await db.collection('marketing_applications').findOne(
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
    const user = await db.collection('marketing_applications').findOne({ userCode });
    if (!user) return false;

    const currentLevel = user.level;
    const threshold = PROMOTION_THRESHOLDS[currentLevel];
    if (!threshold || !threshold.next) return false;

    // Count direct children at the same level
    const children = await db.collection('marketing_applications').find({ sponsorCode: userCode }).toArray();
    const count = children.filter(child => child.level === currentLevel).length;

    // Check if sales target for current level is met
    const target = TARGETS[currentLevel];
    const teamSales = user.teamSales || 0;
    const meetsTarget = teamSales >= target;

    if (count >= threshold.required && meetsTarget) {
        // Promote
        await db.collection('marketing_applications').updateOne(
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

    // Validate referrer exists
    if (!referredBy) {
        throw new Error('ReferredBy is required to create Real Beez member.');
    }
    const sponsor = await db.collection('marketing_applications').findOne({ userCode: referredBy });
    if (!sponsor) {
        throw new Error(`Referrer code "${referredBy}" not found in Real Beez network.`);
    }

    // Generate user code for level ME
    const userCode = await generateUserCode(db, 'ME');

    // Create Real Beez user document
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
        teamSales: 0,
        personalSales: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicationId: appId,
        role: 'user',
    };

    await db.collection('marketing_applications').insertOne(newMlmUser);

    // Update sponsor's children list and count
    await db.collection('marketing_applications').updateOne(
        { userCode: referredBy },
        {
            $push: { children: userCode },
            $inc: { directChildrenCount: 1 },
            $set: { updatedAt: new Date().toISOString() }
        }
    );

    // Update original application with the new MLM user code
    await db.collection('marketing_applications').updateOne(
        { _id: appId },
        { $set: { mlmUserCode: userCode, updatedAt: new Date().toISOString() } }
    );

    // Trigger promotion checks for sponsor
    await promoteUserIfNeeded(db, referredBy);

    return userCode;
}

// --- Joi Schemas (unchanged, but dob made optional string to handle empty) ---
const applicationSchema = Joi.object({
    applicationId: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    fatherName: Joi.string().min(2).max(100).optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().min(5).max(200).optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().email().optional(),
    pinCode: Joi.string().allow("").optional(),
    panNumber: Joi.string().allow("").optional(),
    aadharNumber: Joi.string().allow("").optional(),
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().allow("").optional(),
            location: Joi.string().allow("").optional(),
            phone: Joi.string().allow("").optional(),
            relationship: Joi.string().allow("").optional(),
        })
    ).optional(),
    previousCompany: Joi.string().allow("").optional(),
    previousDesignation: Joi.string().allow("").optional(),
    educationalQualification: Joi.string().allow("").optional(),
    legalCasesPending: Joi.string().allow("").optional(),
    nameAsPerBank: Joi.string().allow("").optional(),
    bankName: Joi.string().allow("").optional(),
    accountNo: Joi.string().allow("").optional(),
    ifscCode: Joi.string().allow("").optional(),
    branch: Joi.string().allow("").optional(),
    bankCity: Joi.string().allow("").optional(),
    declarationNote: Joi.string().allow("").optional(),
    declaration: Joi.boolean().optional(),
    applicantSignature: Joi.string().allow("").optional(),
    referrerSignature: Joi.string().allow("").optional(),
    referredBy: Joi.string().allow("").optional(),
    referredByName: Joi.string().allow("").optional(),
    level: Joi.string().allow("").optional(),
    status: Joi.string().allow("").default("pending"),
    appliedAt: Joi.date().default(Date.now),
});

const updateApplicationSchema = Joi.object({
    id: Joi.string().required(),
    applicationId: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    fatherName: Joi.string().min(2).max(100).optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().email().optional(),
    pinCode: Joi.string().allow("").optional(),
    panNumber: Joi.string().allow("").optional(),
    aadharNumber: Joi.string().allow("").optional(),
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().allow("").optional(),
            location: Joi.string().allow("").optional(),
            phone: Joi.string().allow("").optional(),
            relationship: Joi.string().allow("").optional(),
        })
    ).optional(),
    previousCompany: Joi.string().allow("").optional(),
    previousDesignation: Joi.string().allow("").optional(),
    educationalQualification: Joi.string().allow("").optional(),
    legalCasesPending: Joi.string().allow("").optional(),
    nameAsPerBank: Joi.string().allow("").optional(),
    bankName: Joi.string().allow("").optional(),
    accountNo: Joi.string().allow("").optional(),
    ifscCode: Joi.string().allow("").optional(),
    branch: Joi.string().min(2).max(100).optional(),
    bankCity: Joi.string().allow("").optional(),
    declarationNote: Joi.string().allow("").optional(),
    declaration: Joi.boolean().optional(),
    applicantSignature: Joi.string().allow("").optional(),
    referrerSignature: Joi.string().allow("").optional(),
    referredBy: Joi.string().allow("").optional(),
    referredByName: Joi.string().allow("").optional(),
    level: Joi.string().allow("").optional(),
    status: Joi.string().allow("").optional(),
});

const updateStatusSchema = Joi.object({
    id: Joi.string().required(),
    status: Joi.string().required(),
    remarks: Joi.string().allow(""),
    applicationId: Joi.string().allow("").optional(),
});

// ======================
// API Routes
// ======================

// ✅ POST: Submit new application (single or bulk import safe)
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

        // Duplicate checks (email, phone, PAN, Aadhar)
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

        // Generate unique application ID (atomic)
        const generatedAppId = value.applicationId || await getNextApplicationId(db);

        // Generate unique userCode and mlmUserCode (atomic per level)
        const level = value.level || "ME";
        const userCode = await getNextUserCode(db, level);

        // Build document – handle dob empty
        let dobISO = null;
        if (value.dob && value.dob !== "") {
            try {
                dobISO = new Date(value.dob).toISOString();
            } catch (e) {
                dobISO = null;
            }
        }

        const newApplication = {
            _id: new ObjectId(),
            applicationId: generatedAppId,
            userCode: userCode,
            mlmUserCode: userCode,   // same as userCode initially
            level: level,
            ...(value.fullName !== undefined && { fullName: value.fullName }),
            ...(dobISO && { dob: dobISO }),
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
            ...(value.referredByName !== undefined && { referredByName: value.referredByName }),
            ...((!value.referredBy || value.referredBy === "") && { referredBy: "RB000001" }),
            ...((!value.referredByName || value.referredByName === "") && { referredByName: "K Srinivas" }),
            status: value.status || "pending",
            appliedAt: value.appliedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            remarks: "",
            role: 'user',
        };

        await applications.insertOne(newApplication);

        // Send confirmation email (async)
        if (newApplication.email) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ca8a04;">Application Received</h2>
                    <p>Dear ${newApplication.fullName || 'Applicant'},</p>
                    <p>Thank you for submitting your application. Your application has been successfully received.</p>
                    <p><strong>Application ID:</strong> ${newApplication.applicationId}</p>
                    <p><strong>User Code:</strong> ${newApplication.userCode}</p>
                    <p>You will receive an email once your application is processed.</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">If you have any questions, please contact support.</p>
                </div>
            `;
            sendEmail(newApplication.email, "Application Received - Real Beez Projects Pvt Ltd", emailHtml)
                .catch(err => console.error("❌ Failed to send confirmation email:", err));
        }

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

// ✅ GET: Fetch applications (unchanged, keep as is)
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

        if (applicationId) {
            const application = await applications.findOne({ _id: new ObjectId(applicationId) });
            if (!application) {
                return Response.json({ error: "Application not found", success: false }, { status: 404 });
            }
            return Response.json({ success: true, application });
        }

        const filter = {};
        if (email) filter.email = email;
        if (phone) filter.contactNo = phone;
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const total = await applications.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const results = await applications.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit).toArray();

        const maskedResults = results.map(app => ({
            ...app,
            accountNo: app.accountNo,
            aadharNumber: app.aadharNumber,
            panNumber: app.panNumber,
            applicantSignature: app.applicantSignature || "[SIGNATURE]",
            referrerSignature: app.referrerSignature || "[SIGNATURE]",
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
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}

// ✅ PUT: Update application (status update or partial update)
export async function PUT(req) {
    try {
        const body = await req.json();
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // Status update branch
        if (body.id && body.status && !body.fullName) {
            const { error, value } = updateStatusSchema.validate(body);
            if (error) {
                return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
            }
            const { id, status, remarks, applicationId: preferredAppId } = value;

            const application = await applications.findOne({ _id: new ObjectId(id) });
            if (!application) {
                return Response.json({ error: "Application not found", success: false }, { status: 404 });
            }

            const updateFields = {
                status,
                level: "ME",
                remarks: remarks || application.remarks,
                updatedAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
            };

            let finalAppId = application.applicationId || preferredAppId;
            if (status === 'approved') {
                if (preferredAppId && preferredAppId.trim()) {
                    const existing = await applications.findOne({ applicationId: preferredAppId });
                    if (!existing) {
                        finalAppId = preferredAppId;
                    } else {
                        finalAppId = await getNextApplicationId(db);
                    }
                } else {
                    finalAppId = await getNextApplicationId(db);
                }
                updateFields.applicationId = finalAppId;
            }

            const updateResult = await applications.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );
            if (updateResult.modifiedCount === 0) {
                return Response.json({ error: "Failed to update application status", success: false }, { status: 400 });
            }

            // Post-approval actions
            if (status === 'approved') {
                let mlmUserCode = null;
                let mlmCreationError = null;
                if (application.referredBy && application.referredByName && !(application.mlmUserCode || application.userCode)) {
                    try {
                        mlmUserCode = await createMlmMemberFromApplication(db, application);
                    } catch (mlmError) {
                        console.error("MLM creation failed:", mlmError);
                        mlmCreationError = mlmError.message;
                    }
                }

                if (application.email) {
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #28a745;">Application Approved!</h2>
                            <p>Dear ${application.fullName || 'Applicant'},</p>
                            <p>Congratulations! Your application has been approved.</p>
                            <p><strong>Application ID:</strong> ${finalAppId}</p>
                            ${mlmUserCode ? `<p><strong>Your Real Beez User Code:</strong> ${mlmUserCode}</p>` : '<p><strong>Note:</strong> Your Real Beez account will be created once a sponsor is assigned.</p>'}
                            <p>You can now log in using your Application ID.</p>
                            <hr />
                            <p style="font-size: 12px; color: #666;">Thank you for joining Real Beez Projects Pvt Ltd.</p>
                        </div>
                    `;
                    sendEmail(application.email, "Application Approved - Real Beez Projects Pvt Ltd", emailHtml).catch(err => console.error("Email failed:", err));
                }

                return Response.json({
                    success: true,
                    message: mlmCreationError ? `Application approved but MLM creation failed: ${mlmCreationError}` : (mlmUserCode ? "Application approved and MLM member created" : "Application approved"),
                    applicationId: id,
                    status,
                    remarks,
                    mlmUserCode,
                    appId: finalAppId,
                });
            }

            if (status === 'rejected') {
                if (application.email) {
                    const rejectionHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #dc3545;">Application Status Update</h2>
                            <p>Dear ${application.fullName || 'Applicant'},</p>
                            <p>We regret to inform you that your application has been rejected.</p>
                            <p><strong>Application ID:</strong> ${application.applicationId || finalAppId}</p>
                            ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ''}
                            <hr />
                            <p style="font-size: 12px; color: #666;">Thank you for your interest.</p>
                        </div>
                    `;
                    sendEmail(application.email, "Application Status Update - Real Beez Projects Pvt Ltd", rejectionHtml).catch(err => console.error("Email failed:", err));
                }
                return Response.json({
                    success: true,
                    message: "Application rejected successfully",
                    applicationId: id,
                    status,
                    remarks,
                    appId: finalAppId,
                });
            }
        } else {
            // Partial application update (unchanged)
            const { error, value } = updateApplicationSchema.validate(body);
            if (error) {
                return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
            }
            const { id, ...updateFields } = value;
            const filteredUpdate = {};
            for (const [key, val] of Object.entries(updateFields)) {
                if (val !== undefined) filteredUpdate[key] = val;
            }
            if (Object.keys(filteredUpdate).length === 0) {
                return Response.json({ error: "No fields to update", success: false }, { status: 400 });
            }
            if (filteredUpdate.dob) filteredUpdate.dob = new Date(filteredUpdate.dob).toISOString();
            if (filteredUpdate.emergencyContacts) {
                filteredUpdate.emergencyContacts = filteredUpdate.emergencyContacts.map(contact => ({ ...contact, _id: contact._id || new ObjectId() }));
            }
            // Duplicate checks for unique fields
            if (filteredUpdate.email) {
                const existing = await applications.findOne({ email: filteredUpdate.email, _id: { $ne: new ObjectId(id) } });
                if (existing) return Response.json({ error: "Email already exists", success: false }, { status: 409 });
            }
            if (filteredUpdate.contactNo) {
                const existing = await applications.findOne({ contactNo: filteredUpdate.contactNo, _id: { $ne: new ObjectId(id) } });
                if (existing) return Response.json({ error: "Phone already exists", success: false }, { status: 409 });
            }
            if (filteredUpdate.panNumber) {
                const existing = await applications.findOne({ panNumber: filteredUpdate.panNumber, _id: { $ne: new ObjectId(id) } });
                if (existing) return Response.json({ error: "PAN already exists", success: false }, { status: 409 });
            }
            if (filteredUpdate.aadharNumber) {
                const existing = await applications.findOne({ aadharNumber: filteredUpdate.aadharNumber, _id: { $ne: new ObjectId(id) } });
                if (existing) return Response.json({ error: "Aadhar already exists", success: false }, { status: 409 });
            }
            filteredUpdate.updatedAt = new Date().toISOString();
            const updateResult = await applications.updateOne({ _id: new ObjectId(id) }, { $set: filteredUpdate });
            if (updateResult.modifiedCount === 0) {
                return Response.json({ error: "Failed to update application", success: false }, { status: 400 });
            }
            return Response.json({ success: true, message: "Application updated successfully", applicationId: value.applicationId || id });
        }
    } catch (err) {
        console.error("❌ Error updating application:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}

// ✅ DELETE: Delete an application (unchanged)
export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        const applicationId = url.searchParams.get("id");
        if (!applicationId) {
            return Response.json({ error: "Application ID is required", success: false }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");
        const application = await applications.findOne({ _id: new ObjectId(applicationId) });
        if (!application) {
            return Response.json({ error: "Application not found", success: false }, { status: 404 });
        }
        const deleteResult = await applications.deleteOne({ _id: new ObjectId(applicationId) });
        if (deleteResult.deletedCount === 0) {
            return Response.json({ error: "Failed to delete application", success: false }, { status: 400 });
        }
        return Response.json({ success: true, message: "Application deleted successfully", applicationId });
    } catch (err) {
        console.error("❌ Error deleting application:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}