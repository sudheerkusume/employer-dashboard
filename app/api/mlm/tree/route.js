import clientPromise from "@/app/components/lib/db";

// ----------------------------------------------------------------------
// Rank computation logic (same as your static code)
// ----------------------------------------------------------------------
function computeRank(node) {
    if (!node.children || node.children.length === 0) return "ME";

    const directCount = node.children.length;
    if (directCount < 10) return "ME";

    const childrenRanks = node.children.map(child => child.level || "ME");

    if (childrenRanks.every(r => ["MM", "SMM", "DGM", "AGM", "GM"].includes(r))) return "SMM";
    if (childrenRanks.every(r => ["SMM", "DGM", "AGM", "GM"].includes(r))) return "DGM";
    if (childrenRanks.every(r => ["DGM", "AGM", "GM"].includes(r))) return "AGM";
    if (childrenRanks.every(r => ["AGM", "GM"].includes(r))) return "GM";

    return "MM";
}

function assignRanks(node) {
    if (node.children) {
        node.children.forEach(child => assignRanks(child));
    }
    node.level = computeRank(node);
    return node;
}

// ----------------------------------------------------------------------
// Tree building from database (using referredById)
// ----------------------------------------------------------------------
async function buildTreeFromDB(db, applicationId, visited = new Set()) {
    if (visited.has(applicationId)) return null;
    visited.add(applicationId);

    const doc = await db.collection("marketing_applications").findOne({ applicationId });
    if (!doc) return null;

    // Find children where referredById matches this applicationId (trim spaces)
    const childrenDocs = await db
        .collection("marketing_applications")
        .find({
            referredById: { $regex: new RegExp(`^\\s*${applicationId}\\s*$`), $options: "i" }
        })
        .toArray();

    const children = await Promise.all(
        childrenDocs.map(child => buildTreeFromDB(db, child.applicationId, visited))
    );

    return {
        _id: doc._id.toString(),
        fullName: doc.fullName || "Unknown",
        applicationId: doc.applicationId,
        userCode: doc.mlmUserCode || doc.userCode || doc.applicationId,
        level: doc.level || "ME",                // temporary, will be recomputed
        saleValue: doc.personalSales || 2000,
        children: children.filter(Boolean),
    };
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let applicationId = url.searchParams.get("applicationId");
        if (applicationId) applicationId = applicationId.trim();

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        let rootId = applicationId;

        if (!rootId) {
            // Find a root (no referredById)
            const rootDoc = await db.collection("marketing_applications").findOne({
                $or: [
                    { referredById: { $exists: false } },
                    { referredById: null },
                    { referredById: "" },
                    { referredById: { $regex: /^\s*$/ } }
                ]
            });
            if (!rootDoc) {
                return Response.json({ success: false, error: "No root application found" }, { status: 404 });
            }
            rootId = rootDoc.applicationId;
        }

        let tree = await buildTreeFromDB(db, rootId);
        if (!tree) {
            return Response.json({ success: false, error: "Unable to build tree" }, { status: 404 });
        }

        // Apply dynamic rank computation (like your static tree)
        assignRanks(tree);

        return Response.json({ success: true, tree });
    } catch (err) {
        console.error("Tree API error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}