import clientPromise from "@/app/components/lib/db";

async function buildTree(db, userCode, visited = new Set()) {
    if (visited.has(userCode)) return null;
    visited.add(userCode);

    // Find the user document – must have sponsorCode and level (i.e., an MLM member)
    const user = await db.collection("marketing_applications").findOne({
        userCode,
        sponsorCode: { $exists: true, $ne: null },
        level: { $exists: true, $ne: null },
    });
    if (!user) return null;

    // Find all children (where sponsorCode equals this user's userCode)
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
 * An approved application will have `mlmUserCode` set.
 */
async function resolveUserCodeFromApplicationId(db, applicationId) {
    const app = await db.collection("marketing_applications").findOne({
        applicationId,
        status: "approved",
        mlmUserCode: { $exists: true, $ne: null },
    });
    return app?.mlmUserCode || null;
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let userCode = url.searchParams.get("userCode");
        const applicationId = url.searchParams.get("applicationId");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        let finalUserCode = null;

        if (applicationId) {
            finalUserCode = await resolveUserCodeFromApplicationId(db, applicationId);
            if (!finalUserCode) {
                return Response.json({
                    success: false,
                    error: `No approved MLM member found for applicationId: ${applicationId}`
                }, { status: 404 });
            }
        } else if (userCode) {
            // Check if this userCode exists as an MLM member (has sponsorCode and level)
            const member = await db.collection("marketing_applications").findOne({
                userCode,
                sponsorCode: { $exists: true, $ne: null },
                level: { $exists: true, $ne: null },
            });
            if (!member) {
                return Response.json({ success: false, error: `MLM member not found: ${userCode}` }, { status: 404 });
            }
            finalUserCode = userCode;
        } else {
            // Default root – assumes the top sponsor has no sponsorCode (or sponsorCode = null)
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