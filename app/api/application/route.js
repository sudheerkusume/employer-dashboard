// app/api/application/route.js
import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";

// ----------------------------------------------------------------------
// EMAIL HELPER
// ----------------------------------------------------------------------
async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error("❌ Email not sent – missing EMAIL_USER or EMAIL_PASSWORD env variables");
        throw new Error("Email service not configured");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT) || 587,
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
// ATOMIC COUNTER HELPERS (only for userCodes now)
// ----------------------------------------------------------------------
async function reserveUserCodes(db, level, count = 1) {
    const col = db.collection("marketing_applications");
    const result = await col.findOneAndUpdate(
        { _type: "__counter", _key: `userCode_${level}` },
        { $inc: { seq: count } },
        { upsert: true, returnDocument: "after" }
    );
    const endSeq = result?.seq ?? count;
    const startSeq = endSeq - count + 1;
    return Array.from({ length: count }, (_, i) =>
        `${level}-${(startSeq + i).toString().padStart(3, "0")}`
    );
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
    const { referredById, userCode, fullName, email, contactNo, dob,
        fatherName, address, pinCode, panNumber, aadharNumber,
        bankName, accountNo, ifscCode, branch, bankCity, _id: appId } = application;
    if (!referredById) throw new Error("referredById is required to create Real Beez member.");
    const sponsor = await col.findOne({ userCode, _type: { $ne: "__counter" } });
    if (!sponsor) throw new Error(`Referrer code "${userCode}" not found.`);
    const [newUserCode] = await reserveUserCodes(db, "ME", 1);
    const newMlmUser = {
        _id: new ObjectId(),
        userCode: newUserCode,
        sponsorCode: userCode,
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
        { userCode },
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
    await promoteUserIfNeeded(db, userCode);
    return newUserCode;
}

// ----------------------------------------------------------------------
// JOI SCHEMAS – applicationId is now required
// ----------------------------------------------------------------------
const applicationSchema = Joi.object({
    applicationId: Joi.string().required(), // changed from optional to required
    fullName: Joi.string().min(2).max(100).required(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    modeOfPayment: Joi.string().allow("").optional(),
    dateOfPayment: Joi.string().allow("").optional(),
    kit_delivered: Joi.string().allow("").optional(),
    fatherName: Joi.string().allow("").optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("", null).optional(),
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
    referredById: Joi.string().allow("").optional(),
    referredByName: Joi.string().allow("").optional(),
    level: Joi.string().allow("").optional(),
    status: Joi.string().allow("").default("pending"),
    dateOfApplication: Joi.string().allow("").default(new Date()).optional(),
});

const updateApplicationSchema = Joi.object({
    id: Joi.string().required(),
    applicationId: Joi.string().allow("").optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    modeOfPayment: Joi.string().allow("").optional(),
    dateOfPayment: Joi.string().allow("").optional(),
    kit_delivered: Joi.string().allow("").optional(),
    dob: Joi.alternatives().try(Joi.date(), Joi.string().allow("", null)).optional(),
    fatherName: Joi.string().allow("").optional(),
    bloodGroup: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    contactNo: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("", null).optional(),
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
    referredById: Joi.string().allow("").optional(),
    referredByName: Joi.string().allow("").optional(),
    level: Joi.string().allow("").optional(),
    status: Joi.string().allow("").optional(),
    dateOfApplication: Joi.string().allow("").default(new Date()).optional(),
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
        dateOfApplication: value.dateOfApplication ?? "",
        dateOfPayment: value.dateOfPayment ?? "",
        kit_delivered: value.kit_delivered ?? "",
        referrerSignature: value.referrerSignature ?? "",
        referredById: value.referredById || "SB-000000",
        referredByName: value.referredByName || "K Srinivas",
        status: value.status || "pending",
        appliedAt: Date.now(),
        updatedAt: new Date().toISOString(),
        remarks: "",
        role: "user",
    };
}

// ----------------------------------------------------------------------
// HELPER: FETCH GOOGLE SHEET DATA
// ----------------------------------------------------------------------
async function fetchGoogleSheetData(url) {
    let csvUrl = url;
    if (url.includes("/edit") || url.includes("/spreadsheets/d/")) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            const sheetId = match[1];
            csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        } else {
            throw new Error("Invalid Google Sheets URL");
        }
    } else if (!url.includes("export?format=csv")) {
        throw new Error("Unrecognized Google Sheets URL format");
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.split("\n").filter(line => line.trim());
    if (lines.length < 2) throw new Error("CSV has no data rows");
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = values[idx]; });
            data.push(obj);
        }
    }
    return data;
}

// ----------------------------------------------------------------------
// POST – single object OR array (bulk) – NO AUTO-GENERATION OF applicationId
// ----------------------------------------------------------------------
export async function POST(req) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let rawList = null;

        if (contentType.includes("application/json")) {
            const body = await req.json();
            rawList = Array.isArray(body) ? body : [body];
        }
        else if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file");
            const googleSheetUrl = formData.get("googleSheetUrl");
            if (file && file instanceof File) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const workbook = XLSX.read(buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet);
                if (!rows || rows.length === 0) {
                    return Response.json({ success: false, error: "Excel file contains no data rows" }, { status: 400 });
                }
                rawList = rows;
            }
            else if (googleSheetUrl && typeof googleSheetUrl === "string") {
                rawList = await fetchGoogleSheetData(googleSheetUrl);
            }
            else {
                return Response.json({ success: false, error: "No file or Google Sheet URL provided" }, { status: 400 });
            }
        }
        else {
            return Response.json({ success: false, error: `Unsupported Content-Type: ${contentType}` }, { status: 415 });
        }

        const isBulk = Array.isArray(rawList) && rawList.length > 1;

        if (rawList.length === 0) {
            return Response.json({ success: false, error: "Empty request body" }, { status: 400 });
        }

        // ---------- 1. Validate each record (applicationId is now required) ----------
        const validRecords = [];
        const validationErrors = [];

        for (let i = 0; i < rawList.length; i++) {
            const { _id, _type, applicationId, userCode, mlmUserCode,
                appliedAt, updatedAt, remarks, role, ...rest } = rawList[i];

            if (!rest.fullName || rest.fullName.trim() === "") {
                validationErrors.push({
                    index: i,
                    name: `Row ${i + 1}`,
                    error: "fullName is required",
                });
                continue;
            }

            // Ensure applicationId is present
            if (!rest.applicationId || rest.applicationId.trim() === "") {
                validationErrors.push({
                    index: i,
                    name: rest.fullName || `Row ${i + 1}`,
                    error: "applicationId is required (no auto-generation)",
                });
                continue;
            }

            const { error, value } = applicationSchema.validate(rest);
            if (error) {
                validationErrors.push({
                    index: i,
                    name: rest.fullName || `Row ${i + 1}`,
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

        // ---------- 2. Duplicate detection (in‑batch) ----------
        const batchDuplicateWarnings = [];
        for (const field of DUP_FIELDS) {
            const vals = validRecords.map(r => r.value[field]);
            const dupes = getDuplicatesInBatch(vals);
            dupes.forEach(v =>
                batchDuplicateWarnings.push(`Duplicate ${field} in batch: "${v}"`)
            );
        }

        // ---------- 3. Check existing entries in DB (including applicationId uniqueness) ----------
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        const existingInDB = {};
        for (const field of [...DUP_FIELDS, "applicationId"]) {
            existingInDB[field] = await getExistingInDB(
                col, field, validRecords.map(r => r.value[field])
            );
        }

        // ---------- 4. Separate clean records from duplicates ----------
        const cleanRecords = [];
        const skippedRecords = [];

        for (const rec of validRecords) {
            let dupReason = null;
            // Check standard unique fields
            for (const field of DUP_FIELDS) {
                const v = rec.value[field];
                if (v && v !== "" && v !== "--" && existingInDB[field].has(v)) {
                    dupReason = `${field} already exists: "${v}"`;
                    break;
                }
            }
            // Also check applicationId uniqueness
            if (!dupReason) {
                const appId = rec.value.applicationId;
                if (appId && existingInDB.applicationId.has(appId)) {
                    dupReason = `applicationId already exists: "${appId}"`;
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

        // ---------- 5. Generate userCodes (level‑based) – no applicationId generation ----------
        const levelGroups = {};
        for (const rec of cleanRecords) {
            const lvl = rec.value.level || "ME";
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(rec);
        }

        const userCodePool = {};
        for (const [lvl, recs] of Object.entries(levelGroups)) {
            userCodePool[lvl] = await reserveUserCodes(db, lvl, recs.length);
        }

        const levelCursor = Object.fromEntries(
            Object.keys(levelGroups).map(lvl => [lvl, 0])
        );

        const finalDocs = [];
        for (const rec of cleanRecords) {
            const lvl = rec.value.level || "ME";
            const userCode = userCodePool[lvl][levelCursor[lvl]++];
            // Use the provided applicationId directly
            const finalDoc = buildDocument(rec.value, rec.value.applicationId, userCode);
            finalDocs.push(finalDoc);
        }

        // ---------- 6. Insert into DB (no specific ordering needed) ----------
        const insertResult = await col.insertMany(finalDocs, { ordered: false });

        // ---------- 7. Send email notifications ----------
        const emailPromises = [];
        for (const doc of finalDocs) {
            if (!doc.email) continue;
            const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#ca8a04">Application Received</h2>
                    <p>Dear ${doc.fullName || "Applicant"},</p>
                    <p>Your application has been successfully received.</p>
                    <p><strong>Application ID:</strong> ${doc.applicationId}</p>
                    <p><strong>Your User Code:</strong> ${doc.userCode}</p>
                    <p>You will be notified once your application is reviewed.</p>
                    <hr/>
                    <div style="text-align:center; font-size:12px; color:#666; margin:15px 0;">
                    For queries, please contact support.
                    </div>
                    <p style="font-size:12px;">
                    For application login, please visit the link below:<br/>
                    <a href="https://employer.real-beez.com" style="color:#ca8a04;">https://employer.real-beez.com</a>
                    </p>
                </div>`;
            emailPromises.push(
                sendEmail(doc.email, "Application Received – Real Beez Projects Pvt Ltd", html)
                    .catch(err => console.error(`❌ Email failed for ${doc.email}:`, err))
            );
        }

        const emailResults = await Promise.allSettled(emailPromises);
        const emailFailures = emailResults.filter(r => r.status === "rejected").length;
        if (emailFailures > 0) {
            console.warn(`⚠️ ${emailFailures} email(s) failed to send, but applications were saved.`);
        }

        const maskedDocs = finalDocs.map(maskSensitive);

        if (!isBulk) {
            const doc = finalDocs[0];
            return Response.json({
                success: true,
                message: "Application submitted successfully",
                _id: doc._id,
                applicationId: doc.applicationId,
                userCode: doc.userCode,
                application: maskedDocs[0],
                emailStatus: emailPromises.length === 0 ? "no_email_provided" : (emailFailures === 0 ? "sent" : "partial_failure"),
            });
        }

        return Response.json({
            success: true,
            message: `${insertResult.insertedCount} of ${rawList.length} applications inserted`,
            summary: {
                total: rawList.length,
                inserted: insertResult.insertedCount,
                skipped: skippedRecords.length,
                failed: validationErrors.length,
                emailsSent: emailPromises.length - emailFailures,
                emailsFailed: emailFailures,
            },
            applications: maskedDocs,
            ...(skippedRecords.length && { skippedRecords }),
            ...(validationErrors.length && { validationErrors }),
            ...(batchDuplicateWarnings.length && { batchDuplicateWarnings }),
        });

    } catch (err) {
        console.error("❌ POST error:", err);
        return Response.json({ success: false, error: "Internal Server Error: " + err.message }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// GET – fetch applications
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

        // Single application by ID
        if (applicationId) {
            const application = await col.findOne({
                _id: new ObjectId(applicationId),
                _type: { $ne: "__counter" },
            });
            if (!application) {
                return Response.json({ success: false, error: "Application not found" }, { status: 404 });
            }
            const masked = {
                ...application,
                applicantSignature: application.applicantSignature || "[SIGNATURE]",
                referrerSignature: application.referrerSignature || "[SIGNATURE]",
                dateOfApplication: application.dateOfApplication ?? "",
                dateOfPayment: application.dateOfPayment ?? "",
                kit_delivered: application.kit_delivered ?? "",
            };
            return Response.json({ success: true, application: masked });
        }

        // Build filter for list view
        const filter = { _type: { $ne: "__counter" } };
        if (email) filter.email = email;
        if (phone) filter.contactNo = phone;
        if (status && status !== "all") filter.status = status;

        const skip = (page - 1) * limit;
        const total = await col.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const results = await col
            .find(filter)
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const maskedResults = results.map(app => ({
            ...app,
            applicantSignature: app.applicantSignature || "[SIGNATURE]",
            referrerSignature: app.referrerSignature || "[SIGNATURE]",
            dateOfApplication: app.dateOfApplication ?? "",
            dateOfPayment: app.dateOfPayment ?? "",
            kit_delivered: app.kit_delivered ?? "",
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
// PUT – status update OR partial field update
// ----------------------------------------------------------------------
export async function PUT(req) {
    try {
        const body = await req.json();
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // ======================
        // BRANCH A: Bulk status update (ids array)
        // ======================
        if (body.ids && Array.isArray(body.ids) && body.ids.length > 0 && body.status) {
            const { ids, status, remarks = '' } = body;
            if (!['approved', 'rejected'].includes(status)) {
                return Response.json({ error: 'Invalid status. Must be "approved" or "rejected".', success: false }, { status: 400 });
            }

            const objectIds = ids.map(id => {
                try { return new ObjectId(id); } catch { return null; }
            }).filter(id => id !== null);

            if (objectIds.length === 0) {
                return Response.json({ error: 'Invalid ID(s) provided', success: false }, { status: 400 });
            }

            const applications = await col.find({ _id: { $in: objectIds } }).toArray();

            if (applications.length === 0) {
                return Response.json({ error: 'No valid applications found', success: false }, { status: 404 });
            }

            const results = [];
            const errors = [];

            const promises = applications.map(async (app) => {
                try {
                    const updateFields = {
                        status,
                        level: "ME",
                        remarks: remarks || app.remarks || "",
                        updatedAt: new Date().toISOString(),
                        reviewedAt: new Date().toISOString(),
                    };
                    let finalAppId = app.applicationId;

                    if (status === "approved") {
                        if (!finalAppId) {
                            // Since we no longer generate applicationIds, we reject or just warn? 
                            // We'll keep the fallback generation for approval only if needed, but your requirement said remove auto-generation.
                            // To be safe, we'll still allow generation upon approval if missing? But the user said "remove auto generate application id as of now just take from excel sheet".
                            // For consistency, we will NOT generate missing applicationId even on approval.
                            // Instead, we'll skip assigning and log an error.
                            console.error(`Application ${app._id} approved but missing applicationId – no auto-generation.`);
                        } else {
                            updateFields.applicationId = finalAppId;
                        }
                    }

                    await col.updateOne({ _id: app._id }, { $set: updateFields });

                    if (app.email) {
                        if (status === "approved") {
                            let mlmUserCode = null;
                            if (app.referredById && !(app.mlmUserCode || app.userCode)) {
                                try {
                                    mlmUserCode = await createMlmMemberFromApplication(db, app);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            const html = `
                                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                                    <h2 style="color:#28a745">Application Approved!</h2>
                                    <p>Dear ${app.fullName || "Applicant"},</p>
                                    <p>Congratulations! Your application has been approved.</p>
                                    <p><strong>Application ID:</strong> ${finalAppId || "Not assigned"}</p>
                                    ${mlmUserCode ? `<p><strong>Your Real Beez User Code:</strong> ${mlmUserCode}</p>` : ""}
                                    <hr/>
                                    <p style="font-size:12px;"><a href="https://employer.real-beez.com">https://employer.real-beez.com</a></p>
                                </div>`;
                            await sendEmail(app.email, "Application Approved – Real Beez Projects Pvt Ltd", html).catch(err => console.error(`Email failed for ${app.email}:`, err));
                        } else if (status === "rejected") {
                            const html = `
                                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                                    <h2 style="color:#dc3545">Application Status Update</h2>
                                    <p>Dear ${app.fullName || "Applicant"},</p>
                                    <p>We regret to inform you that your application has been rejected.</p>
                                    <p><strong>Application ID:</strong> ${finalAppId || app.applicationId}</p>
                                    ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ""}
                                    <hr/>
                                    <p style="font-size:12px;color:#666">Thank you for your interest.</p>
                                </div>`;
                            await sendEmail(app.email, "Application Status Update – Real Beez Projects Pvt Ltd", html).catch(err => console.error(`Email failed for ${app.email}:`, err));
                        }
                    }

                    results.push({ id: app._id.toString(), status, success: true });
                } catch (err) {
                    console.error(`Error updating application ${app._id}:`, err);
                    errors.push({ id: app._id.toString(), error: err.message });
                }
            });

            await Promise.allSettled(promises);

            return Response.json({
                success: true,
                message: `Updated ${results.length} of ${ids.length} applications to ${status}`,
                results,
                errors: errors.length ? errors : undefined,
            });
        }

        // ======================
        // BRANCH B: Single status update (id + status)
        // ======================
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
                        // no auto-generation, just keep original
                        console.warn(`Preferred applicationId ${preferredAppId} already exists – keeping original ${finalAppId || "none"}`);
                    }
                }
                if (finalAppId) {
                    updateFields.applicationId = finalAppId;
                } else {
                    console.error(`Application ${id} approved but missing applicationId – no auto-generation.`);
                }
            }

            const updateResult = await col.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );
            if (updateResult.modifiedCount === 0) {
                return Response.json({ error: "Failed to update status", success: false }, { status: 400 });
            }

            if (application.email) {
                if (status === "approved") {
                    let mlmUserCode = null;
                    if (application.referredById && !(application.mlmUserCode || application.userCode)) {
                        try {
                            mlmUserCode = await createMlmMemberFromApplication(db, application);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    const html = `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                            <h2 style="color:#28a745">Application Approved!</h2>
                            <p>Dear ${application.fullName || "Applicant"},</p>
                            <p>Congratulations! Your application has been approved.</p>
                            <p><strong>Application ID:</strong> ${finalAppId || "Not assigned"}</p>
                            ${mlmUserCode ? `<p><strong>Your Real Beez User Code:</strong> ${mlmUserCode}</p>` : ""}
                            <hr/>
                            <p style="font-size:12px;"><a href="https://employer.real-beez.com">https://employer.real-beez.com</a></p>
                        </div>`;
                    await sendEmail(application.email, "Application Approved – Real Beez Projects Pvt Ltd", html).catch(err => console.error(`Email failed for ${application.email}:`, err));
                } else if (status === "rejected") {
                    const html = `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                            <h2 style="color:#dc3545">Application Status Update</h2>
                            <p>Dear ${application.fullName || "Applicant"},</p>
                            <p>We regret to inform you that your application has been rejected.</p>
                            <p><strong>Application ID:</strong> ${finalAppId || application.applicationId}</p>
                            ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ""}
                            <hr/>
                            <p style="font-size:12px;color:#666">Thank you for your interest.</p>
                        </div>`;
                    await sendEmail(application.email, "Application Status Update – Real Beez Projects Pvt Ltd", html).catch(err => console.error(`Email failed for ${application.email}:`, err));
                }
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

        // ======================
        // BRANCH C: Partial field update (edit entire application)
        // ======================
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
// DELETE – delete one or multiple applications
// ----------------------------------------------------------------------
export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        let ids = [];

        const queryId = url.searchParams.get("id");
        if (queryId) {
            ids = [queryId];
        } else {
            let body;
            try {
                body = await req.json();
            } catch { }
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

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

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

        const deleteResult = await col.deleteMany({ _id: { $in: existingDocs.map(d => d._id) } });

        const affectedLevels = new Set();
        for (const doc of existingDocs) {
            if (doc.level) affectedLevels.add(doc.level);
        }

        for (const level of affectedLevels) {
            const userDocs = await col
                .find(
                    { level, userCode: { $exists: true, $nin: [null, ""] }, _type: { $ne: "__counter" } },
                    { projection: { userCode: 1 } }
                )
                .toArray();
            let maxUserNum = 0;
            for (const doc of userDocs) {
                const match = doc.userCode?.match(new RegExp(`^${level}-(\\d+)$`));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxUserNum) maxUserNum = num;
                }
            }
            await col.findOneAndUpdate(
                { _type: "__counter", _key: `userCode_${level}` },
                { $set: { seq: maxUserNum } },
                { upsert: true }
            );
        }

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