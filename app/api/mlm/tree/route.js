import clientPromise from "@/app/components/lib/db";

// Helper to normalise an application ID (remove spaces, convert to uppercase)
function normalizeAppId(id) {
    if (!id) return null;
    return id.toString().toUpperCase().replace(/\s+/g, '');
}

async function buildTree(db, appId, viewerAppId, visited = new Set()) {
    // Prevent circular references
    if (visited.has(appId)) return null;
    visited.add(appId);

    const user = await db.collection("marketing_applications").findOne({ applicationId: appId });
    if (!user) return null;

    // Hide high ranks for downline users (business rule)
    const highRanks = ["DGM", "AGM", "GM"];
    if (viewerAppId && highRanks.includes(user.level) && user.applicationId !== viewerAppId) {
        return {
            ...user,
            children: [],
            hidden: true,
        };
    }

    // Find children where referredById (normalised) matches this applicationId
    const childrenDocs = await db
        .collection("marketing_applications")
        .find({})
        .toArray();

    const ownNormalisedId = normalizeAppId(appId);
    const children = childrenDocs
        .filter(child => {
            const refNorm = normalizeAppId(child.referredById);
            return refNorm === ownNormalisedId;
        })
        .map(child => child.applicationId);

    const childTrees = await Promise.all(
        children.map(childAppId => buildTree(db, childAppId, viewerAppId, visited))
    );

    return {
        _id: user._id.toString(),
        fullName: user.fullName,
        userCode: user.userCode,
        mlmUserCode: user.userCode,
        applicationId: user.applicationId,
        level: user.level,
        saleValue: user.personalSales || 2000,
        children: childTrees.filter(Boolean),
    };
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let appId = url.searchParams.get("applicationId");
        let viewerAppId = url.searchParams.get("viewerCode") || appId;

        // Fallback to userCode parameter for backward compatibility
        if (!appId) {
            const userCode = url.searchParams.get("userCode");
            if (userCode) {
                const client = await clientPromise;
                const db = client.db(process.env.MONGODB_DBNAME);
                const user = await db.collection("marketing_applications").findOne({ userCode });
                if (user) appId = user.applicationId;
            }
        }

        if (!appId) appId = "SB-000001";

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        const tree = await buildTree(db, appId, viewerAppId);
        if (!tree) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}