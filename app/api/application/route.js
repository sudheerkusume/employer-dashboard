import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";
import nodemailer from "nodemailer";

// ----------------------------------------------------------------------
// EMAIL HELPER
// ----------------------------------------------------------------------
async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true",
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

// ----------------------------------------------------------------------
// MLM HELPERS (unchanged)
// ----------------------------------------------------------------------
const PROMOTION_THRESHOLDS = {
    ME: { next: "MM", required: 5 },
    MM: { next: "SMM", required: 5 },
    SMM: { next: "AGM", required: 5 },
    AGM: { next: "DGM", required: 5 },
    DGM: { next: "GM", required: 5 },
    GM: { next: null, required: null },
};

const TARGETS = {
    ME: 300000,
    MM: 1000000,
    SMM: 3500000,
    AGM: 10000000,
    DGM: 20000000,
    GM: 50000000,
};

async function promoteUserIfNeeded(db, userCode) {
    const col = db.collection("marketing_applications");
    const user = await col.findOne({ userCode });
    if (!user) return false;
    const threshold = PROMOTION_THRESHOLDS[user.level];
    if (!threshold?.next) return false;
    const children = await col.find({ sponsorCode: userCode }).toArray();
    const count = children.filter(c => c.level === user.level).length;
    const meetsTarget = (user.teamSales || 0) >= (TARGETS[user.level] || 0);
    if (count >= threshold.required && meetsTarget) {
        await col.updateOne(
            { userCode },
            { $set: { level: threshold.next, updatedAt: new Date().toISOString() } }
        );
        if (user.sponsorCode) await promoteUserIfNeeded(db, user.sponsorCode);
        return true;
    }
    return false;
}

async function createMlmMemberFromApplication(db, application) {
    const col = db.collection("marketing_applications");
    const {
        referredBy, userCode, fullName, email, contactNo, dob,
        fatherName, address, pinCode, panNumber, aadharNumber,
        bankName, accountNo, ifscCode, branch, bankCity,
        _id: appId, applicationId
    } = application;

    if (!referredBy) throw new Error("referredBy is required to create Real Beez member.");
    if (!userCode) throw new Error("userCode is missing on the application.");

    const sponsor = await col.findOne({ userCode: referredBy });
    if (!sponsor) throw new Error(`Referrer code "${referredBy}" not found.`);

    const newMlmUser = {
        _id: new ObjectId(),
        userCode,
        sponsorCode: referredBy,
        level: application.level || "ME",
        fullName,
        email,
        contactNo,
        dob: dob ? new Date(dob).toISOString() : null,
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
        status: "active",
        children: [],
        directChildrenCount: 0,
        teamSales: 0,
        personalSales: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicationId,
        role: "user",
    };

    await col.insertOne(newMlmUser);

    await col.updateOne(
        { userCode: referredBy },
        {
            $push: { children: userCode },
            $inc: { directChildrenCount: 1 },
            $set: { updatedAt: new Date().toISOString() },
        }
    );

    await col.updateOne(
        { _id: appId },
        { $set: { mlmUserCode: userCode, updatedAt: new Date().toISOString() } }
    );

    await promoteUserIfNeeded(db, referredBy);

    return userCode;
}

// ----------------------------------------------------------------------
// JOI SCHEMAS – applicationId and userCode are optional but we enforce presence logic in POST
// ----------------------------------------------------------------------

const applicationSchema = Joi.object({
    applicationId: Joi.string().allow("").optional(),
    userCode: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    fatherName: Joi.string().allow("").optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().optional(),
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
});

const updateApplicationSchema = Joi.object({
    id: Joi.string().required(),
    fullName: Joi.string().min(2).max(100).optional(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    fatherName: Joi.string().allow("").optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().optional(),
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
    status: Joi.string().allow("").optional(),
});

const updateStatusSchema = Joi.object({
    id: Joi.string().required(),
    status: Joi.string().required(),
    remarks: Joi.string().allow(""),
    applicationId: Joi.string().allow("").optional(),
});

// ----------------------------------------------------------------------
// DUPLICATE CHECK HELPERS
// ----------------------------------------------------------------------

const DUP_FIELDS = ["email", "contactNo", "panNumber", "aadharNumber", "applicationId", "userCode"];

async function getExistingInDB(col, field, values) {
    const nonEmpty = [...new Set(values.filter(v => v && v !== "" && v !== "--"))];
    if (!nonEmpty.length) return new Set();
    const docs = await col
        .find({ [field]: { $in: nonEmpty } }, { projection: { [field]: 1 } })
        .toArray();
    return new Set(docs.map(d => d[field]));
}

function getDuplicatesInBatch(values) {
    const seen = new Set();
    const dupes = new Set();
    for (const v of values) {
        if (!v || v === "" || v === "--") continue;
        if (seen.has(v)) dupes.add(v);
        else seen.add(v);
    }
    return dupes;
}

// ----------------------------------------------------------------------
// GENERATION HELPERS (NO COUNTER DOCUMENTS)
// ----------------------------------------------------------------------

/**
 * Generate `count` new application IDs (e.g., "RB000001") by looking up the
 * maximum existing applicationId numeric part.
 */
async function generateApplicationIds(db, count) {
    const col = db.collection("marketing_applications");
    const highest = await col
        .find({ applicationId: { $exists: true, $ne: null, $ne: "" } })
        .sort({ applicationId: -1 })
        .limit(1)
        .toArray();
    let lastNum = 0;
    if (highest.length > 0 && highest[0].applicationId) {
        const match = highest[0].applicationId.match(/^RB(\d+)$/);
        if (match) lastNum = parseInt(match[1], 10);
    }
    const start = lastNum + 1;
    const ids = [];
    for (let i = 0; i < count; i++) {
        ids.push(`RB${(start + i).toString().padStart(6, "0")}`);
    }
    return ids;
}

/**
 * Generate `count` new user codes for a given level (e.g., "ME-001")
 * by finding the highest numeric suffix for that level.
 */
async function generateUserCodes(db, level, count) {
    const col = db.collection("marketing_applications");
    const highest = await col
        .find({ userCode: { $regex: `^${level}-\\d+$` } })
        .sort({ userCode: -1 })
        .limit(1)
        .toArray();
    let lastNum = 0;
    if (highest.length > 0 && highest[0].userCode) {
        const match = highest[0].userCode.match(new RegExp(`^${level}-(\\d+)$`));
        if (match) lastNum = parseInt(match[1], 10);
    }
    const start = lastNum + 1;
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(`${level}-${(start + i).toString().padStart(3, "0")}`);
    }
    return codes;
}

// ----------------------------------------------------------------------
// DOCUMENT BUILDER
// ----------------------------------------------------------------------

function parseDob(dob) {
    if (!dob || dob === "") return null;
    try {
        const d = new Date(dob);
        return isNaN(d.getTime()) ? null : d.toISOString();
    } catch { return null; }
}

function maskSensitive(doc) {
    const r = { ...doc };
    if (r.accountNo) r.accountNo = "****" + String(r.accountNo).slice(-4);
    if (r.aadharNumber) r.aadharNumber = "****" + String(r.aadharNumber).slice(-4);
    if (r.panNumber) r.panNumber = "****" + String(r.panNumber).slice(-4);
    if (r.applicantSignature) r.applicantSignature = "[SIGNATURE]";
    if (r.referrerSignature) r.referrerSignature = "[SIGNATURE]";
    return r;
}

function buildDocument(value, applicationId, userCode) {
    const level = value.level || "ME";
    return {
        _id: new ObjectId(),
        applicationId,
        userCode,
        mlmUserCode: userCode,
        level,
        fullName: value.fullName ?? "",
        dob: parseDob(value.dob),
        fatherName: value.fatherName ?? "",
        bloodGroup: value.bloodGroup ?? "",
        address: value.address ?? "",
        contactNo: value.contactNo ?? "",
        email: value.email ?? "",
        pinCode: value.pinCode ?? "",
        panNumber: value.panNumber ?? "",
        aadharNumber: value.aadharNumber ?? "",
        emergencyContacts: (value.emergencyContacts ?? []).map(c => ({
            ...c, _id: new ObjectId(),
        })),
        previousCompany: value.previousCompany ?? "",
        previousDesignation: value.previousDesignation ?? "",
        educationalQualification: value.educationalQualification ?? "",
        legalCasesPending: value.legalCasesPending ?? "",
        nameAsPerBank: value.nameAsPerBank ?? "",
        bankName: value.bankName ?? "",
        accountNo: value.accountNo ?? "",
        ifscCode: value.ifscCode ?? "",
        branch: value.branch ?? "",
        bankCity: value.bankCity ?? "",
        declarationNote: value.declarationNote ?? "",
        declaration: value.declaration ?? false,
        applicantSignature: value.applicantSignature ?? "",
        referrerSignature: value.referrerSignature ?? "",
        referredBy: value.referredBy || "RB000001",
        referredByName: value.referredByName || "K Srinivas",
        status: value.status || "pending",
        appliedAt: Date.now(),
        updatedAt: new Date().toISOString(),
        remarks: "",
        role: "user",
    };
}

// ----------------------------------------------------------------------
// POST — supports provided IDs or auto-generation (no counters)
// ----------------------------------------------------------------------

export async function POST(req) {
    try {
        const body = await req.json();
        const isBulk = Array.isArray(body);
        const rawList = isBulk ? body : [body];

        if (rawList.length === 0) {
            return Response.json({ success: false, error: "Empty request body" }, { status: 400 });
        }

        // 1. Validate each record (Joi)
        const validRecords = [];
        const validationErrors = [];

        for (let i = 0; i < rawList.length; i++) {
            const { _id, _type, appliedAt, updatedAt, remarks, role, ...rest } = rawList[i];
            const { error, value } = applicationSchema.validate(rest);
            if (error) {
                validationErrors.push({
                    index: i,
                    name: rawList[i]?.fullName || `Row ${i + 1}`,
                    error: error.details[0].message,
                });
            } else {
                validRecords.push({ originalIndex: i, value });
            }
        }

        if (validRecords.length === 0) {
            return Response.json({
                success: false,
                error: "All records failed validation",
                validationErrors,
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // 2. Separate records based on ID presence
        const both = [];       // both IDs provided
        const onlyApp = [];    // only applicationId
        const onlyUser = [];   // only userCode
        const none = [];       // neither

        for (const rec of validRecords) {
            const hasAppId = rec.value.applicationId && rec.value.applicationId.trim() !== "";
            const hasUserCode = rec.value.userCode && rec.value.userCode.trim() !== "";
            if (hasAppId && hasUserCode) {
                both.push(rec);
            } else if (hasAppId && !hasUserCode) {
                onlyApp.push(rec);
            } else if (!hasAppId && hasUserCode) {
                onlyUser.push(rec);
            } else {
                none.push(rec);
            }
        }

        // 3. Generate missing IDs
        // For onlyApp: generate userCode (level from value.level or default "ME")
        // For onlyUser: generate applicationId
        // For none: generate both

        // Prepare groups for generation
        const toGenerateUserCodes = []; // records needing userCode (onlyApp + none)
        const toGenerateAppIds = [];    // records needing applicationId (onlyUser + none)

        for (const rec of onlyApp) {
            toGenerateUserCodes.push(rec);
        }
        for (const rec of none) {
            toGenerateUserCodes.push(rec);
            toGenerateAppIds.push(rec);
        }
        for (const rec of onlyUser) {
            toGenerateAppIds.push(rec);
        }

        // Generate application IDs in batches by count (use once)
        if (toGenerateAppIds.length > 0) {
            const appIds = await generateApplicationIds(db, toGenerateAppIds.length);
            for (let i = 0; i < toGenerateAppIds.length; i++) {
                toGenerateAppIds[i].generatedAppId = appIds[i];
            }
        }

        // Generate user codes per level
        if (toGenerateUserCodes.length > 0) {
            // Group by level
            const levelGroups = {};
            for (const rec of toGenerateUserCodes) {
                const lvl = rec.value.level || "ME";
                (levelGroups[lvl] = levelGroups[lvl] || []).push(rec);
            }
            const userCodePool = {};
            for (const [lvl, recs] of Object.entries(levelGroups)) {
                userCodePool[lvl] = await generateUserCodes(db, lvl, recs.length);
            }
            const levelCursor = Object.fromEntries(Object.keys(levelGroups).map(lvl => [lvl, 0]));
            for (const rec of toGenerateUserCodes) {
                const lvl = rec.value.level || "ME";
                rec.generatedUserCode = userCodePool[lvl][levelCursor[lvl]++];
            }
        }

        // 4. Build final documents and collect provided IDs for duplicate checks
        const documents = [];
        const allRecords = [...both, ...onlyApp, ...onlyUser, ...none];

        // Prepare for duplicate checks: collect all provided applicationIds and userCodes
        const allProvidedAppIds = [];
        const allProvidedUserCodes = [];

        for (const rec of allRecords) {
            // Determine final IDs
            let finalAppId = rec.value.applicationId;
            let finalUserCode = rec.value.userCode;

            if (rec.generatedAppId) finalAppId = rec.generatedAppId;
            if (rec.generatedUserCode) finalUserCode = rec.generatedUserCode;

            // Store for duplicate check
            if (finalAppId) allProvidedAppIds.push(finalAppId);
            if (finalUserCode) allProvidedUserCodes.push(finalUserCode);

            // Build document
            documents.push(buildDocument(rec.value, finalAppId, finalUserCode));
        }

        // 5. Duplicate checks
        const batchDuplicateWarnings = [];
        // Check duplicates for applicationId and userCode within batch
        const dupAppIdsBatch = getDuplicatesInBatch(allProvidedAppIds);
        const dupUserCodesBatch = getDuplicatesInBatch(allProvidedUserCodes);
        dupAppIdsBatch.forEach(v => batchDuplicateWarnings.push(`Duplicate applicationId in batch: "${v}"`));
        dupUserCodesBatch.forEach(v => batchDuplicateWarnings.push(`Duplicate userCode in batch: "${v}"`));

        // Check against DB
        const existingAppIds = await getExistingInDB(col, "applicationId", allProvidedAppIds);
        const existingUserCodes = await getExistingInDB(col, "userCode", allProvidedUserCodes);

        // Filter records that have duplicates
        const validDocuments = [];
        const skippedRecords = [];

        for (let i = 0; i < allRecords.length; i++) {
            const rec = allRecords[i];
            const finalAppId = documents[i].applicationId;
            const finalUserCode = documents[i].userCode;

            let dupReason = null;
            if (finalAppId && existingAppIds.has(finalAppId)) {
                dupReason = `applicationId already exists: "${finalAppId}"`;
            } else if (finalUserCode && existingUserCodes.has(finalUserCode)) {
                dupReason = `userCode already exists: "${finalUserCode}"`;
            } else if (dupAppIdsBatch.has(finalAppId) || dupUserCodesBatch.has(finalUserCode)) {
                dupReason = "Duplicate ID within batch";
            }

            if (dupReason) {
                skippedRecords.push({
                    index: rec.originalIndex,
                    name: rec.value.fullName || `Row ${rec.originalIndex + 1}`,
                    reason: dupReason,
                });
            } else {
                validDocuments.push(documents[i]);
            }
        }

        if (validDocuments.length === 0) {
            return Response.json({
                success: false,
                error: "All records are duplicates – nothing inserted",
                skipped: skippedRecords,
                ...(validationErrors.length && { validationErrors }),
            }, { status: 409 });
        }

        // 6. Insert with retry on duplicate key
        let insertResult;
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
            try {
                insertResult = await col.insertMany(validDocuments, { ordered: false });
                break;
            } catch (err) {
                if (err.code === 11000 && retries < maxRetries - 1) {
                    console.warn("Duplicate key during insert, regenerating IDs for generated ones...");
                    // Regenerate only the IDs that were generated (i.e., not provided by user)
                    // We need to regenerate for all records that had a generated ID
                    // For simplicity, we can regenerate all generated IDs for the whole batch
                    // but that might cause new duplicates with provided ones, so we only regenerate for those with generated IDs
                    const recordsWithGeneratedIds = allRecords.filter(r => r.generatedAppId || r.generatedUserCode);
                    if (recordsWithGeneratedIds.length > 0) {
                        // Regenerate application IDs for those needing them
                        const needApp = recordsWithGeneratedIds.filter(r => r.generatedAppId);
                        if (needApp.length) {
                            const newAppIds = await generateApplicationIds(db, needApp.length);
                            for (let i = 0; i < needApp.length; i++) {
                                needApp[i].generatedAppId = newAppIds[i];
                            }
                        }
                        // Regenerate user codes per level for those needing them
                        const needUser = recordsWithGeneratedIds.filter(r => r.generatedUserCode);
                        if (needUser.length) {
                            const levelGroups = {};
                            for (const rec of needUser) {
                                const lvl = rec.value.level || "ME";
                                (levelGroups[lvl] = levelGroups[lvl] || []).push(rec);
                            }
                            const newUserCodes = {};
                            for (const [lvl, recs] of Object.entries(levelGroups)) {
                                newUserCodes[lvl] = await generateUserCodes(db, lvl, recs.length);
                            }
                            const levelCursor = Object.fromEntries(Object.keys(levelGroups).map(lvl => [lvl, 0]));
                            for (const rec of needUser) {
                                const lvl = rec.value.level || "ME";
                                rec.generatedUserCode = newUserCodes[lvl][levelCursor[lvl]++];
                            }
                        }
                        // Rebuild documents for all records
                        const newDocuments = [];
                        for (const rec of allRecords) {
                            let finalAppId = rec.value.applicationId;
                            let finalUserCode = rec.value.userCode;
                            if (rec.generatedAppId) finalAppId = rec.generatedAppId;
                            if (rec.generatedUserCode) finalUserCode = rec.generatedUserCode;
                            newDocuments.push(buildDocument(rec.value, finalAppId, finalUserCode));
                        }
                        // Filter duplicates again (since we regenerated, some might still conflict, but we'll retry)
                        validDocuments.length = 0;
                        for (let i = 0; i < newDocuments.length; i++) {
                            const doc = newDocuments[i];
                            // We could re‑check duplicates, but for simplicity we'll let the next insert attempt handle it
                            validDocuments.push(doc);
                        }
                        retries++;
                        continue;
                    }
                }
                console.error("Insert error:", err);
                throw err;
            }
        }

        // 7. Send emails (fire and forget)
        for (const doc of validDocuments) {
            if (!doc.email) continue;
            const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#ca8a04">Application Received</h2>
                    <p>Dear ${doc.fullName || "Applicant"},</p>
                    <p>Your application has been successfully received.</p>
                    <p><strong>Application ID:</strong> ${doc.applicationId}</p>
                    <p><strong>User Code:</strong> ${doc.userCode}</p>
                    <p>You will be notified once your application is reviewed.</p>
                    <hr/>
                    <p style="font-size:12px;color:#666">For queries, please contact support.</p>
                </div>`;
            sendEmail(doc.email, "Application Received – Real Beez Projects Pvt Ltd", html)
                .catch(err => console.error(`❌ Email failed [${doc.email}]:`, err));
        }

        const maskedDocs = validDocuments.map(maskSensitive);

        if (!isBulk) {
            const doc = validDocuments[0];
            return Response.json({
                success: true,
                message: "Application submitted successfully",
                _id: doc._id,
                applicationId: doc.applicationId,
                userCode: doc.userCode,
                application: maskedDocs[0],
            });
        }

        return Response.json({
            success: true,
            message: `${insertResult.insertedCount} of ${rawList.length} applications inserted`,
            summary: {
                total: rawList.length,
                inserted: insertResult.insertedCount,
                skipped: skippedRecords.length + validationErrors.length,
                failed: validationErrors.length,
            },
            applications: maskedDocs,
            ...(skippedRecords.length && { skippedRecords }),
            ...(validationErrors.length && { validationErrors }),
            ...(batchDuplicateWarnings.length && { batchDuplicateWarnings }),
        });

    } catch (err) {
        console.error("❌ POST error:", err);
        return Response.json({
            success: false,
            error: "Internal Server Error",
            details: err.message, // remove in production
        }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// GET — unchanged (no _type filter needed)
// ----------------------------------------------------------------------

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
        const col = db.collection("marketing_applications");

        if (applicationId) {
            const application = await col.findOne({ _id: new ObjectId(applicationId) });
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
        const total = await col.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const results = await col.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit).toArray();

        const maskedResults = results.map(app => ({
            ...app,
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
        console.error("❌ GET error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// PUT — unchanged
// ----------------------------------------------------------------------

export async function PUT(req) {
    try {
        const body = await req.json();
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // Branch A: Status update
        if (body.id && body.status && !body.fullName) {
            const { error, value } = updateStatusSchema.validate(body);
            if (error) {
                return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
            }

            const { id, status, remarks, applicationId: preferredAppId } = value;

            const application = await col.findOne({ _id: new ObjectId(id) });
            if (!application) {
                return Response.json({ error: "Application not found", success: false }, { status: 404 });
            }

            const updateFields = {
                status,
                level: "ME",
                remarks: remarks || application.remarks || "",
                updatedAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
            };

            let finalAppId = application.applicationId;

            if (status === "approved") {
                if (preferredAppId && preferredAppId.trim()) {
                    const existing = await col.findOne({ applicationId: preferredAppId });
                    if (!existing) {
                        finalAppId = preferredAppId;
                    }
                }
                if (!finalAppId) {
                    const [newId] = await generateApplicationIds(db, 1);
                    finalAppId = newId;
                }
                updateFields.applicationId = finalAppId;
            }

            const updateResult = await col.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );
            if (updateResult.modifiedCount === 0) {
                return Response.json({ error: "Failed to update status", success: false }, { status: 400 });
            }

            if (status === "approved") {
                let mlmUserCode = null;
                let mlmCreationError = null;
                if (!application.userCode) {
                    mlmCreationError = "Application has no userCode – cannot create MLM member";
                } else if (application.referredBy && !application.mlmUserCode) {
                    try {
                        mlmUserCode = await createMlmMemberFromApplication(db, application);
                    } catch (e) {
                        console.error("MLM creation failed:", e);
                        mlmCreationError = e.message;
                    }
                }
                if (application.email) {
                    const html = `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                            <h2 style="color:#28a745">Application Approved!</h2>
                            <p>Dear ${application.fullName || "Applicant"},</p>
                            <p>Congratulations! Your application has been approved.</p>
                            <p><strong>Application ID:</strong> ${finalAppId}</p>
                            ${mlmUserCode
                            ? `<p><strong>Your Real Beez User Code:</strong> ${mlmUserCode}</p>`
                            : "<p>Your Real Beez account will be created once a sponsor is assigned.</p>"
                        }
                            <hr/>
                            <p style="font-size:12px;color:#666">Thank you for joining Real Beez Projects Pvt Ltd.</p>
                        </div>`;
                    sendEmail(application.email, "Application Approved – Real Beez Projects Pvt Ltd", html)
                        .catch(err => console.error("Email failed:", err));
                }
                return Response.json({
                    success: true,
                    message: mlmCreationError
                        ? `Approved but MLM creation failed: ${mlmCreationError}`
                        : mlmUserCode
                            ? "Application approved and MLM member created"
                            : "Application approved",
                    applicationId: id,
                    appId: finalAppId,
                    status,
                    remarks,
                    mlmUserCode,
                });
            }

            if (status === "rejected" && application.email) {
                const html = `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                        <h2 style="color:#dc3545">Application Status Update</h2>
                        <p>Dear ${application.fullName || "Applicant"},</p>
                        <p>We regret to inform you that your application has been rejected.</p>
                        <p><strong>Application ID:</strong> ${application.applicationId || finalAppId}</p>
                        ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ""}
                        <hr/>
                        <p style="font-size:12px;color:#666">Thank you for your interest.</p>
                    </div>`;
                sendEmail(application.email, "Application Status Update – Real Beez Projects Pvt Ltd", html)
                    .catch(err => console.error("Email failed:", err));
            }

            return Response.json({
                success: true,
                message: `Application ${status} successfully`,
                applicationId: id,
                appId: finalAppId,
                status,
                remarks,
            });
        }

        // Branch B: Partial field update
        const { error, value } = updateApplicationSchema.validate(body);
        if (error) {
            return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
        }

        const { id, ...updateFields } = value;
        delete updateFields.applicationId;
        delete updateFields.userCode;
        delete updateFields.mlmUserCode;

        const filteredUpdate = Object.fromEntries(
            Object.entries(updateFields).filter(([, v]) => v !== undefined)
        );

        if (Object.keys(filteredUpdate).length === 0) {
            return Response.json({ error: "No fields to update", success: false }, { status: 400 });
        }

        if (filteredUpdate.dob) {
            filteredUpdate.dob = new Date(filteredUpdate.dob).toISOString();
        }
        if (filteredUpdate.emergencyContacts) {
            filteredUpdate.emergencyContacts = filteredUpdate.emergencyContacts.map(c => ({
                ...c, _id: c._id || new ObjectId(),
            }));
        }

        const dupCheckFields = ["email", "contactNo", "panNumber", "aadharNumber"];
        for (const field of dupCheckFields) {
            if (!filteredUpdate[field]) continue;
            const existing = await col.findOne({
                [field]: filteredUpdate[field],
                _id: { $ne: new ObjectId(id) },
            });
            if (existing) {
                return Response.json({
                    error: `${field} already exists`,
                    success: false,
                }, { status: 409 });
            }
        }

        filteredUpdate.updatedAt = new Date().toISOString();

        const updateResult = await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: filteredUpdate }
        );
        if (updateResult.modifiedCount === 0) {
            return Response.json({ error: "Failed to update application", success: false }, { status: 400 });
        }

        return Response.json({
            success: true,
            message: "Application updated successfully",
            id,
        });

    } catch (err) {
        console.error("❌ PUT error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// DELETE — unchanged
// ----------------------------------------------------------------------

export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        let ids = url.searchParams.getAll("id");

        if (ids.length === 0) {
            try {
                const body = await req.json();
                if (body.id) ids = [body.id];
                if (body.ids) ids = body.ids;
            } catch {
                // no body
            }
        }

        ids = [...new Set(ids.filter(id => id && id.trim() !== ""))];
        if (ids.length === 0) {
            return Response.json(
                { success: false, error: "At least one application ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        const validObjectIds = [];
        const invalidIds = [];
        for (const id of ids) {
            try {
                validObjectIds.push(new ObjectId(id));
            } catch {
                invalidIds.push(id);
            }
        }
        if (invalidIds.length > 0) {
            return Response.json(
                { success: false, error: `Invalid ID format for: ${invalidIds.join(", ")}`, invalidIds },
                { status: 400 }
            );
        }

        const found = await col
            .find({ _id: { $in: validObjectIds } })
            .project({ _id: 1 })
            .toArray();

        const foundIds = found.map(doc => doc._id.toString());
        const notFoundIds = ids.filter(id => !foundIds.includes(id));

        if (foundIds.length === 0) {
            return Response.json(
                { success: false, error: "No applications found for the provided ID(s)", notFound: notFoundIds },
                { status: 404 }
            );
        }

        const deleteResult = await col.deleteMany({
            _id: { $in: found.map(doc => doc._id) }
        });

        const isSingle = ids.length === 1;
        return Response.json({
            success: true,
            message: isSingle
                ? "Application deleted successfully"
                : `${deleteResult.deletedCount} of ${ids.length} applications deleted`,
            deleted: deleteResult.deletedCount,
            deletedIds: foundIds,
            ...(notFoundIds.length && { notFound: notFoundIds })
        });

    } catch (err) {
        console.error("❌ DELETE error:", err);
        return Response.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}