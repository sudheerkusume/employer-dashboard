// app/api/mlm/tree/route.js

async function buildTree(db, userCode, viewerCode, showAll = false, visited = new Set()) {
    if (visited.has(userCode)) return null;
    visited.add(userCode);

    const user = await db.collection("marketing_applications").findOne({ userCode });
    if (!user) return null;

    // Hide high ranks for non‑admin viewers (business rule)
    const highRanks = ["DGM", "AGM", "GM"];
    if (!showAll && viewerCode && highRanks.includes(user.level) && user.userCode !== viewerCode) {
        return {
            ...user,
            children: [],
            hidden: true,
        };
    }

    const childrenDocs = await db
        .collection("marketing_applications")
        .find({ sponsorCode: userCode })
        .toArray();

    const children = await Promise.all(
        childrenDocs.map(child => buildTree(db, child.userCode, viewerCode, showAll, visited))
    );

    return {
        _id: user._id.toString(),
        fullName: user.fullName,
        userCode: user.userCode,
        mlmUserCode: user.userCode,
        level: user.level,
        saleValue: user.personalSales || 2000,
        children: children.filter(Boolean),
    };
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let userCode = url.searchParams.get("userCode");
        const applicationId = url.searchParams.get("applicationId");
        const viewerCode = url.searchParams.get("viewerCode") || userCode;
        const showAll = url.searchParams.get("showAll") === "true";   // ← new

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        if (applicationId && !userCode) {
            const appUser = await db.collection("marketing_applications").findOne({ applicationId });
            if (!appUser) {
                return Response.json({ error: `No user found with applicationId: ${applicationId}` }, { status: 404 });
            }
            userCode = appUser.userCode;
        }

        if (!userCode) userCode = "SB-000001";

        const tree = await buildTree(db, userCode, viewerCode, showAll);
        if (!tree) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}