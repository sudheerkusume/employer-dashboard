// app/api/mlm/upline/route.js or wherever you keep your API routes

import clientPromise from "@/app/components/lib/db";

/**
 * Recursively build upline chain using referredById (sponsor's applicationId)
 * @param {Db} db - MongoDB database connection
 * @param {string} applicationId - Current user's applicationId
 * @param {Array} chain - Accumulator for upline nodes (ordered from top to immediate parent)
 * @returns {Promise<Array>} - Upline chain
 */
async function getUplineByApplicationId(db, applicationId, chain = []) {
    const user = await db.collection("marketing_applications").findOne({ applicationId });
    if (!user) return chain;

    // If the user has a referrer (sponsor), fetch that sponsor and prepend to chain
    if (user.referredById) {
        const sponsor = await db.collection("marketing_applications").findOne({ applicationId: user.referredById });
        if (sponsor) {
            // Prepend sponsor to chain (so top ancestor is first)
            chain.unshift({
                _id: sponsor._id.toString(),
                fullName: sponsor.fullName,
                applicationId: sponsor.applicationId,
                userCode: sponsor.userCode,
                level: sponsor.level || "Pending",
            });
            // Continue up the chain
            return getUplineByApplicationId(db, sponsor.applicationId, chain);
        }
    }
    return chain;
}

/**
 * Alternative: Lookup by userCode and then get upline using referredById
 * (if frontend ever passes userCode instead of applicationId)
 */
async function getUplineByUserCode(db, userCode, chain = []) {
    const user = await db.collection("marketing_applications").findOne({ userCode });
    if (!user) return chain;

    if (user.referredById) {
        const sponsor = await db.collection("marketing_applications").findOne({ applicationId: user.referredById });
        if (sponsor) {
            chain.unshift({
                _id: sponsor._id.toString(),
                fullName: sponsor.fullName,
                applicationId: sponsor.applicationId,
                userCode: sponsor.userCode,
                level: sponsor.level || "Pending",
            });
            return getUplineByApplicationId(db, sponsor.applicationId, chain);
        }
    }
    return chain;
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const applicationId = url.searchParams.get("applicationId");
        const userCode = url.searchParams.get("userCode");

        if (!applicationId && !userCode) {
            return Response.json(
                { success: false, error: "Either applicationId or userCode is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        let upline = [];
        if (applicationId) {
            upline = await getUplineByApplicationId(db, applicationId);
        } else if (userCode) {
            upline = await getUplineByUserCode(db, userCode);
        }

        return Response.json({ success: true, upline });
    } catch (err) {
        console.error("Upline API error:", err);
        return Response.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}