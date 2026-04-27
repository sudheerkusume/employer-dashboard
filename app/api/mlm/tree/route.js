import clientPromise from "@/app/components/lib/db";


async function buildTree(db, userCode, showAll = false, visited = new Set()) {
    if (visited.has(userCode)) return null;
    visited.add(userCode);

    const user = await db.collection("marketing_applications").findOne({ userCode });
    if (!user) return null;

    const userLevels = ["ME", "MM", "SMM", "DGM", "AGM", "GM"];
    const shouldHide = !showAll && userLevels.includes(user.level);

    let children = [];
    if (!shouldHide) {
        const childrenDocs = await db
            .collection("marketing_applications")
            .find({ sponsorCode: userCode })
            .toArray();

        children = await Promise.all(
            childrenDocs.map(child => buildTree(db, child.userCode, showAll, visited))
        );
        children = children.filter(Boolean);
    }

    return {
        _id: user._id.toString(),
        fullName: user.fullName,
        userCode: user.userCode,
        level: user.level,
        saleValue: user.personalSales || 2000,
        children,
    };
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let userCode = url.searchParams.get("userCode");
        const showAll = url.searchParams.get("showAll") === "true";

        if (!userCode) {
            // Fallback to a default user (optional)
            userCode = "SB-000000";
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        const tree = await buildTree(db, userCode, showAll);
        if (!tree) {
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}