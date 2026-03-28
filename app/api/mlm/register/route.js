import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import Joi from "joi";

// Level definitions and promotion thresholds
const LEVELS = ['ME', 'MM', 'SMM', 'AGM', 'DGM', 'GM'];
const PROMOTION_THRESHOLDS = {
    'ME': { next: 'MM', required: 5 },
    'MM': { next: 'SMM', required: 5 },
    'SMM': { next: 'AGM', required: 5 },
    'AGM': { next: 'DGM', required: 5 },
    'DGM': { next: 'GM', required: 5 },
    'GM': { next: null, required: null }
};

// Validation schema for registration
const registrationSchema = Joi.object({
    sponsorCode: Joi.string().required(),
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
    nameAsPerBank: Joi.string().min(3).max(100).required(),
    bankName: Joi.string().min(3).max(100).required(),
    accountNo: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    bankCity: Joi.string().min(2).max(50).required(),
    declarationNote: Joi.string().allow(""),
    declaration: Joi.boolean().valid(true).required(),
    // No signatures needed for registration
});

// Helper to generate next user code for a given level
async function generateUserCode(db, level) {
    const prefix = level; // e.g., "ME"
    // Find the highest number for this prefix
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

// Helper to check and promote a user, recursively up the chain
async function promoteUserIfNeeded(db, userCode) {
    const user = await db.collection('marketing_applications').findOne({ userCode });
    if (!user) return false;

    const currentLevel = user.level;
    const threshold = PROMOTION_THRESHOLDS[currentLevel];
    if (!threshold || !threshold.next) return false;

    // Count direct children that are at the same level as currentLevel (because we need this level's children to promote)
    // Actually promotion requires having 5 direct downlines at the current level.
    // So we need to count children whose level === currentLevel
    const children = await db.collection('marketing_applications').find({ sponsorCode: userCode }).toArray();
    const count = children.filter(child => child.level === currentLevel).length;

    if (count >= threshold.required) {
        // Promote
        await db.collection('marketing_applications').updateOne(
            { userCode },
            { $set: { level: threshold.next, updatedAt: new Date().toISOString() } }
        );
        console.log(`Promoted ${userCode} from ${currentLevel} to ${threshold.next}`);

        // Recursively check sponsor (if exists) because this user's level changed, which might affect the sponsor's count
        if (user.sponsorCode) {
            await promoteUserIfNeeded(db, user.sponsorCode);
        }
        return true;
    }
    return false;
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Validate input
        const { error, value } = registrationSchema.validate(body);
        if (error) {
            return Response.json({ error: error.details[0].message, success: false }, { status: 400 });
        }

        const {
            sponsorCode,
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
            nameAsPerBank,
            bankName,
            accountNo,
            ifscCode,
            branch,
            bankCity,
            declarationNote,
            declaration,
        } = value;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection('marketing_applications');

        // Check if sponsor exists
        const sponsor = await users.findOne({ userCode: sponsorCode });
        if (!sponsor) {
            return Response.json({ error: "Sponsor not found", success: false }, { status: 404 });
        }

        // Check uniqueness of email, phone, PAN, Aadhar
        const existingEmail = await users.findOne({ email });
        if (existingEmail) return Response.json({ error: "Email already registered", success: false }, { status: 409 });
        const existingPhone = await users.findOne({ contactNo });
        if (existingPhone) return Response.json({ error: "Phone number already registered", success: false }, { status: 409 });
        const existingPan = await users.findOne({ panNumber });
        if (existingPan) return Response.json({ error: "PAN number already registered", success: false }, { status: 409 });
        const existingAadhar = await users.findOne({ aadharNumber });
        if (existingAadhar) return Response.json({ error: "Aadhar number already registered", success: false }, { status: 409 });

        // Generate user code
        const userCode = await generateUserCode(db, 'ME');

        // Create new user document
        const newUser = {
            _id: new ObjectId(),
            userCode,
            sponsorCode,
            level: 'ME',
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
            nameAsPerBank,
            bankName,
            accountNo,
            ifscCode,
            branch,
            bankCity,
            declarationNote: declarationNote || "",
            declaration,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Real Beez specific fields
            children: [], // will be populated later
            directChildrenCount: 0,
            // Optional: we can store counts per level for efficiency
        };

        await users.insertOne(newUser);

        // Add this user to sponsor's children array
        await users.updateOne(
            { userCode: sponsorCode },
            {
                $push: { children: userCode },
                $inc: { directChildrenCount: 1 }
            }
        );

        // Now check for promotions in the chain
        await promoteUserIfNeeded(db, sponsorCode);

        // Return success with user code
        return Response.json({
            success: true,
            message: "Registration successful",
            userCode: userCode,
        });
    } catch (err) {
        console.log("Error in registration:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}