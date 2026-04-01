// app/api/application/route.js
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
// MLM HELPERS
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
    const user = await col.findOne({ userCode, _type: { $ne: "__counter" } });
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
        bankName, accountNo, ifscCode, branch, bankCity, _id: appId,
    } = application;

    if (!referredBy) throw new Error("referredBy is required to create Real Beez member.");

    const sponsor = await col.findOne({ userCode: referredBy, _type: { $ne: "__counter" } });
    if (!sponsor) throw new Error(`Referrer code "${referredBy}" not found.`);

    // Generate a new user code for the MLM member
    const [newUserCode] = await generateUserCodesForLevel(db, "ME", 1);

    const newMlmUser = {
        _id: new ObjectId(),
        userCode: newUserCode,
        sponsorCode: referredBy,
        level: "ME",
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
        applicationId: appId,
        role: "user",
    };

    await col.insertOne(newMlmUser);

    await col.updateOne(
        { userCode: referredBy },
        {
            $push: { children: newUserCode },
            $inc: { directChildrenCount: 1 },
            $set: { updatedAt: new Date().toISOString() },
        }
    );

    await col.updateOne(
        { _id: appId },
        { $set: { mlmUserCode: newUserCode, updatedAt: new Date().toISOString() } }
    );

    await promoteUserIfNeeded(db, referredBy);

    return newUserCode;
}

// ----------------------------------------------------------------------
// JOI SCHEMAS
// ----------------------------------------------------------------------
const applicationSchema = Joi.object({
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
const DUP_FIELDS = ["email", "contactNo", "panNumber", "aadharNumber"];

async function getExistingInDB(col, field, values) {
    const nonEmpty = [...new Set(values.filter(v => v && v !== "" && v !== "--"))];
    if (!nonEmpty.length) return new Set();
    const docs = await col
        .find(
            { _type: { $ne: "__counter" }, [field]: { $in: nonEmpty } },
            { projection: { [field]: 1 } }
        )
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
// SEQUENCE HELPERS (NO COUNTER DOCUMENTS)
// ----------------------------------------------------------------------
async function getMaxApplicationIdNum(col) {
    const highest = await col
        .find(
            { applicationId: { $exists: true, $nin: [null, ""] }, _type: { $ne: "__counter" } },
            { projection: { applicationId: 1 } }
        )
        .sort({ applicationId: -1 })
        .limit(1)
        .toArray();
    if (highest.length === 0) return 0;
    const match = highest[0].applicationId.match(/^RB(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}

async function getMaxUserCodeNum(col, level) {
    const regex = new RegExp(`^${level}-\\d+$`);
    const highest = await col
        .find(
            { userCode: { $exists: true, $nin: [null, ""], $regex: regex }, _type: { $ne: "__counter" } },
            { projection: { userCode: 1 } }
        )
        .sort({ userCode: -1 })
        .limit(1)
        .toArray();
    if (highest.length === 0) return 0;
    const match = highest[0].userCode.match(new RegExp(`^${level}-(\\d+)$`));
    return match ? parseInt(match[1], 10) : 0;
}

function parseApplicationIdNum(appId) {
    const match = appId.match(/^RB(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

function parseUserCodeNum(userCode, level) {
    const regex = new RegExp(`^${level}-(\\d+)$`);
    const match = userCode.match(regex);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Generate `count` application IDs sequentially, starting after the higher of:
 *   - the current maximum in the database, and
 *   - the maximum provided in the batch (if any).
 * Returns an array of IDs (e.g. ["RB000001", ...]).
 */
async function generateApplicationIds(col, count, providedIds = []) {
    const dbMax = await getMaxApplicationIdNum(col);
    let maxProvided = 0;
    for (const id of providedIds) {
        const num = parseApplicationIdNum(id);
        if (num !== null && num > maxProvided) maxProvided = num;
    }
    const start = Math.max(dbMax, maxProvided) + 1;
    return Array.from({ length: count }, (_, i) =>
        `RB${(start + i).toString().padStart(6, "0")}`
    );
}

/**
 * Generate `count` user codes for a given level sequentially, starting after the higher of:
 *   - the current maximum in the database for that level, and
 *   - the maximum provided in the batch for that level (if any).
 * Returns an array of codes (e.g. ["ME-001", ...]).
 */
async function generateUserCodesForLevel(col, level, count, providedCodes = []) {
    const dbMax = await getMaxUserCodeNum(col, level);
    let maxProvided = 0;
    for (const code of providedCodes) {
        const num = parseUserCodeNum(code, level);
        if (num !== null && num > maxProvided) maxProvided = num;
    }
    const start = Math.max(dbMax, maxProvided) + 1;
    return Array.from({ length: count }, (_, i) =>
        `${level}-${(start + i).toString().padStart(3, "0")}`
    );
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
// POST — single object OR array (bulk)
// ----------------------------------------------------------------------
export async function POST(req) {
    try {
        const body = await req.json();

        // ── 1. Normalise to array ─────────────────────────────────────────────
        const isBulk = Array.isArray(body);
        const rawList = isBulk ? body : [body];

        if (rawList.length === 0) {
            return Response.json({ success: false, error: "Empty request body" }, { status: 400 });
        }

        // ── 2. Strip server-generated fields & validate every record ──────────
        const validRecords = [];
        const validationErrors = [];

        for (let i = 0; i < rawList.length; i++) {
            const {
                _id, _type,
                applicationId, userCode, mlmUserCode,
                appliedAt, updatedAt,
                remarks, role,
                ...rest
            } = rawList[i];

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

        // ── 3. DB connection ──────────────────────────────────────────────────
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // ── 4. Duplicate detection (early filtering) ──────────────────────────
        const batchDuplicateWarnings = [];
        for (const field of DUP_FIELDS) {
            const vals = validRecords.map(r => r.value[field]);
            const dupes = getDuplicatesInBatch(vals);
            dupes.forEach(v =>
                batchDuplicateWarnings.push(`Duplicate ${field} in batch: "${v}"`)
            );
        }

        const existingInDB = {};
        for (const field of DUP_FIELDS) {
            existingInDB[field] = await getExistingInDB(
                col, field, validRecords.map(r => r.value[field])
            );
        }

        const cleanRecords = [];
        const skippedRecords = [];
        for (const rec of validRecords) {
            let dupReason = null;
            for (const field of DUP_FIELDS) {
                const v = rec.value[field];
                if (v && v !== "" && v !== "--" && existingInDB[field].has(v)) {
                    dupReason = `${field} already exists: "${v}"`;
                    break;
                }
            }
            if (dupReason) {
                skippedRecords.push({
                    index: rec.originalIndex,
                    name: rec.value.fullName || `Row ${rec.originalIndex + 1}`,
                    reason: dupReason,
                });
            } else {
                cleanRecords.push(rec);
            }
        }

        if (cleanRecords.length === 0) {
            return Response.json({
                success: false,
                error: "All records are duplicates – nothing inserted",
                skipped: skippedRecords,
                ...(validationErrors.length && { validationErrors }),
            }, { status: 409 });
        }

        // ── 5. Retry loop for ID generation & insertion ───────────────────────
        let toInsert = cleanRecords;   // records that need insertion
        let insertedDocs = [];
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (toInsert.length > 0 && retryCount < MAX_RETRIES) {
            // Gather provided IDs from this batch (in case the caller passed them)
            const providedAppIds = toInsert
                .map(r => r.value.applicationId)
                .filter(id => id && id.trim());
            const providedUserCodesByLevel = {};
            for (const rec of toInsert) {
                const lvl = rec.value.level || "ME";
                if (rec.value.userCode && rec.value.userCode.trim()) {
                    if (!providedUserCodesByLevel[lvl]) providedUserCodesByLevel[lvl] = [];
                    providedUserCodesByLevel[lvl].push(rec.value.userCode.trim());
                }
            }

            // Generate new IDs (respecting DB max and provided IDs)
            const newAppIds = await generateApplicationIds(col, toInsert.length, providedAppIds);
            const newUserCodesByLevel = {};
            for (const [lvl, recs] of Object.entries(
                toInsert.reduce((acc, rec) => {
                    const lvl = rec.value.level || "ME";
                    acc[lvl] = (acc[lvl] || 0) + 1;
                    return acc;
                }, {})
            )) {
                const provided = providedUserCodesByLevel[lvl] || [];
                newUserCodesByLevel[lvl] = await generateUserCodesForLevel(col, lvl, recs, provided);
            }

            // Assign IDs to records
            let appIdx = 0;
            const levelCounters = {};
            for (const lvl of Object.keys(newUserCodesByLevel)) {
                levelCounters[lvl] = 0;
            }

            const documents = toInsert.map(rec => {
                const lvl = rec.value.level || "ME";
                const appId = newAppIds[appIdx++];
                const userCode = newUserCodesByLevel[lvl][levelCounters[lvl]++];
                return buildDocument(rec.value, appId, userCode);
            });

            // Attempt insert
            try {
                const result = await col.insertMany(documents, { ordered: false });
                insertedDocs.push(...documents);
                toInsert = []; // success
            } catch (err) {
                if (err.code === 11000) { // Duplicate key error
                    // Some records conflicted. We need to extract the ones that succeeded.
                    // Since we used ordered: false, the insertedIds array tells us which
                    // indices succeeded. Filter out those that succeeded and retry the rest.
                    const succeededIndices = new Set(
                        err.result?.insertedIds
                            ? Object.values(err.result.insertedIds).map((_, idx) => idx)
                            : []
                    );
                    const failedRecords = toInsert.filter((_, idx) => !succeededIndices.has(idx));
                    toInsert = failedRecords;
                    retryCount++;
                    if (toInsert.length === 0) break;
                } else {
                    throw err; // other error, abort
                }
            }
        }

        if (toInsert.length > 0) {
            return Response.json({
                success: false,
                error: `Failed to insert ${toInsert.length} records after ${MAX_RETRIES} retries due to duplicate conflicts.`,
                remainingRecords: toInsert.map(r => ({ index: r.originalIndex, name: r.value.fullName })),
            }, { status: 409 });
        }

        // ── 6. Send emails (fire-and-forget) ──────────────────────────────────
        for (const doc of insertedDocs) {
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

        // ── 7. Response ───────────────────────────────────────────────────────
        const maskedDocs = insertedDocs.map(maskSensitive);

        if (!isBulk) {
            const doc = insertedDocs[0];
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
            message: `${insertedDocs.length} of ${rawList.length} applications inserted`,
            summary: {
                total: rawList.length,
                inserted: insertedDocs.length,
                skipped: skippedRecords.length,
                failed: validationErrors.length,
            },
            applications: maskedDocs,
            ...(skippedRecords.length && { skippedRecords }),
            ...(validationErrors.length && { validationErrors }),
            ...(batchDuplicateWarnings.length && { batchDuplicateWarnings }),
        });

    } catch (err) {
        console.error("❌ POST error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// GET
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
            const application = await col.findOne({
                _id: new ObjectId(applicationId),
                _type: { $ne: "__counter" },
            });
            if (!application) {
                return Response.json({ error: "Application not found", success: false }, { status: 404 });
            }
            return Response.json({ success: true, application });
        }

        const filter = { _type: { $ne: "__counter" } };
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
// PUT
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

            const application = await col.findOne({
                _id: new ObjectId(id),
                _type: { $ne: "__counter" },
            });
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
                    const existing = await col.findOne({
                        applicationId: preferredAppId,
                        _type: { $ne: "__counter" },
                    });
                    if (!existing) {
                        finalAppId = preferredAppId;
                    } else {
                        // preferred ID taken — auto-generate
                        const [newId] = await generateApplicationIds(col, 1);
                        finalAppId = newId;
                    }
                } else if (!finalAppId) {
                    const [newId] = await generateApplicationIds(col, 1);
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

                if (application.referredBy && !(application.mlmUserCode || application.userCode)) {
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
        delete updateFields._type;

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
                _type: { $ne: "__counter" },
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
            { _id: new ObjectId(id), _type: { $ne: "__counter" } },
            { $set: filteredUpdate }
        );
        if (updateResult.modifiedCount === 0) {
            return Response.json({ error: "Failed to update application", success: false }, { status: 400 });
        }

        return Response.json({ success: true, message: "Application updated successfully", id });

    } catch (err) {
        console.error("❌ PUT error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// DELETE
// ----------------------------------------------------------------------
export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        let ids = [];

        // --- 1. Extract IDs from query parameter or request body ---
        const queryId = url.searchParams.get("id");
        if (queryId) {
            ids = [queryId];
        } else {
            let body;
            try {
                body = await req.json();
            } catch {
                // No body or invalid JSON
            }
            if (body) {
                if (body.id && typeof body.id === "string") {
                    ids = [body.id];
                } else if (body.ids && Array.isArray(body.ids)) {
                    ids = body.ids;
                }
            }
        }

        if (ids.length === 0) {
            return Response.json(
                { success: false, error: "At least one application ID is required" },
                { status: 400 }
            );
        }

        // --- 2. Validate ObjectIds ---
        const objectIds = [];
        const invalidIds = [];
        for (const id of ids) {
            try {
                objectIds.push(new ObjectId(id));
            } catch {
                invalidIds.push(id);
            }
        }
        if (invalidIds.length > 0) {
            return Response.json(
                { success: false, error: `Invalid ID format: ${invalidIds.join(", ")}`, invalidIds },
                { status: 400 }
            );
        }

        // --- 3. DB connection ---
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // --- 4. Find existing applications (exclude counter docs) ---
        const existingDocs = await col
            .find({ _id: { $in: objectIds }, _type: { $ne: "__counter" } })
            .toArray();

        const existingIds = existingDocs.map(doc => doc._id.toString());
        const notFound = ids.filter(id => !existingIds.includes(id));

        if (existingDocs.length === 0) {
            return Response.json(
                { success: false, error: "No applications found", notFound },
                { status: 404 }
            );
        }

        // --- 5. For each document, attempt to decrement counters (if last) ---
        for (const doc of existingDocs) {
            // Application ID counter
            const appIdMatch = doc.applicationId?.match(/^RB(\d+)$/);
            if (appIdMatch) {
                const appNum = parseInt(appIdMatch[1], 10);
                const appCounter = await col.findOneAndUpdate(
                    { _type: "__counter", _key: "applicationId" },
                    { $inc: { seq: -1 } },
                    { returnDocument: "after", upsert: false }
                );
                if (appCounter && appCounter.seq !== appNum) {
                    // Not the last – revert
                    await col.findOneAndUpdate(
                        { _type: "__counter", _key: "applicationId" },
                        { $inc: { seq: 1 } }
                    );
                    console.warn(`Deleted applicationId ${doc.applicationId} was not the last. Counter unchanged.`);
                }
            }

            // User code counter for its level
            const userCodeMatch = doc.userCode?.match(/^(\w+)-(\d+)$/);
            if (userCodeMatch) {
                const level = userCodeMatch[1];
                const userNum = parseInt(userCodeMatch[2], 10);
                const userCounter = await col.findOneAndUpdate(
                    { _type: "__counter", _key: `userCode_${level}` },
                    { $inc: { seq: -1 } },
                    { returnDocument: "after", upsert: false }
                );
                if (userCounter && userCounter.seq !== userNum) {
                    await col.findOneAndUpdate(
                        { _type: "__counter", _key: `userCode_${level}` },
                        { $inc: { seq: 1 } }
                    );
                    console.warn(`Deleted userCode ${doc.userCode} was not the last. Counter unchanged.`);
                }
            }
        }

        // --- 6. Perform deletion ---
        const deleteResult = await col.deleteMany({ _id: { $in: existingDocs.map(d => d._id) } });

        // --- 7. Build response ---
        const isSingle = ids.length === 1;
        return Response.json({
            success: true,
            message: isSingle
                ? "Application deleted successfully"
                : `${deleteResult.deletedCount} of ${ids.length} applications deleted`,
            deleted: deleteResult.deletedCount,
            deletedIds: existingIds,
            ...(notFound.length && { notFound }),
        });

    } catch (err) {
        console.error("❌ DELETE error:", err);
        return Response.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}