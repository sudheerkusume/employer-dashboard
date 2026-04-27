import clientPromise from "@/app/components/lib/db";

async function buildTree(db, userCode, visited = new Set()) {
    if (visited.has(userCode)) return null;
    visited.add(userCode);

    const user = await db.collection("marketing_applications").findOne({ userCode });
    if (!user) return null;

    // Always fetch children – no hiding
    const childrenDocs = await db
        .collection("marketing_applications")
        .find({ sponsorCode: userCode })
        .toArray();

    const children = await Promise.all(
        childrenDocs.map(child => buildTree(db, child.userCode, visited))
    );

    return {
        _id: user._id.toString(),
        fullName: user.fullName,
        userCode: user.userCode,
        level: user.level,
        saleValue: user.personalSales || 2000,
        children: children.filter(Boolean),
    };
}

/**
 * Resolve an applicationId OR userCode to the actual MLM userCode.
 */
async function resolveUserCode(db, identifier) {
    // Check if identifier is an Application ID (SB-xxxxxx)
    if (/^SB-\d{6}$/.test(identifier)) {
        const application = await db.collection("marketing_applications").findOne({
            applicationId: identifier,
            _type: { $ne: "__counter" },
        });
        if (application && application.mlmUserCode) return application.mlmUserCode;
        return null;
    }
    // Otherwise treat as userCode directly
    const user = await db.collection("marketing_applications").findOne({ userCode: identifier });
    return user ? identifier : null;
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
            finalUserCode = await resolveUserCode(db, applicationId);
            if (!finalUserCode) {
                return Response.json({ success: false, error: `No MLM member found for applicationId: ${applicationId}` }, { status: 404 });
            }
        } else if (userCode) {
            finalUserCode = await resolveUserCode(db, userCode);
            if (!finalUserCode) {
                return Response.json({ success: false, error: `User not found for userCode: ${userCode}` }, { status: 404 });
            }
        } else {
            // Default root MLM user (change to your root's userCode, e.g., "ME-001")
            finalUserCode = "ME-001";
        }

        const tree = await buildTree(db, finalUserCode);
        if (!tree) {
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}