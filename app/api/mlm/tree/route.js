import clientPromise from "@/app/components/lib/db";

/**
 * Recursively builds the downline tree from the marketing_applications collection.
 * Only documents that have both `sponsorCode` and `level` are considered MLM members.
 * @param {Db} db - MongoDB instance
 * @param {string} userCode - MLM userCode (e.g., "ME-001")
 * @param {Set} visited - Cycle detection
 * @returns {Promise<Object|null>}
 */
async function buildTree(db, userCode, visited = new Set()) {
    if (visited.has(userCode)) return null;
    visited.add(userCode);

    const user = await db.collection("marketing_applications").findOne({
        userCode,
        sponsorCode: { $exists: true, $ne: null },
        level: { $exists: true, $ne: null },
    });
    if (!user) return null;

    const childrenDocs = await db
        .collection("marketing_applications")
        .find({
            sponsorCode: userCode,
            sponsorCode: { $exists: true, $ne: null },
            level: { $exists: true, $ne: null },
        })
        .toArray();

    const children = await Promise.all(
        childrenDocs.map(child => buildTree(db, child.userCode, visited))
    );

    return {
        _id: user._id.toString(),
        fullName: user.fullName || "Unknown",
        userCode: user.userCode,
        level: user.level,
        saleValue: user.personalSales || 2000,
        children: children.filter(Boolean),
    };
}

/**
 * Resolve an applicationId to the corresponding MLM userCode.
 * Looks up the document by trimmed applicationId.
 */
async function resolveUserCodeFromApplicationId(db, applicationId) {
    const trimmedId = applicationId.trim();
    const doc = await db.collection("marketing_applications").findOne({ applicationId: trimmedId });
    if (!doc) return null;
    // Prefer mlmUserCode, fallback to userCode
    return doc.mlmUserCode || doc.userCode || null;
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let applicationId = url.searchParams.get("applicationId");

        // Trim whitespace
        if (applicationId) applicationId = applicationId.trim();

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        let finalUserCode = null;

        if (applicationId) {
            finalUserCode = await resolveUserCodeFromApplicationId(db, applicationId);
            if (!finalUserCode) {
                return Response.json({
                    success: false,
                    error: `No MLM member found for applicationId: ${applicationId}`
                }, { status: 404 });
            }
        } else {
            // Default root – find a user with no sponsorCode (or null/empty)
            const root = await db.collection("marketing_applications").findOne({
                $or: [
                    { sponsorCode: { $exists: false } },
                    { sponsorCode: null },
                    { sponsorCode: "" }
                ],
                level: { $exists: true, $ne: null },
            });
            if (!root) {
                return Response.json({ success: false, error: "No root user found" }, { status: 404 });
            }
            finalUserCode = root.userCode;
        }

        const tree = await buildTree(db, finalUserCode);
        if (!tree) {
            return Response.json({ success: false, error: "Unable to build tree for this user" }, { status: 404 });
        }

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}