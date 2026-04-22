import clientPromise from "@/app/components/lib/db";

async function buildTree(db, userCode, viewerCode, visited = new Set()) {
  // Prevent circular references
  if (visited.has(userCode)) return null;
  visited.add(userCode);

  const user = await db.collection("marketing_applications").findOne({ userCode });
  if (!user) return null;

  // Hide high ranks for downline users (business rule)
  const highRanks = ["DGM", "AGM", "GM"];
  if (viewerCode && highRanks.includes(user.level) && user.userCode !== viewerCode) {
    return {
      ...user,
      children: [],
      hidden: true,
    };
  }

  // Fetch children (sponsored users)
  const childrenDocs = await db
    .collection("marketing_applications")
    .find({ sponsorCode: userCode })
    .toArray();

  const children = await Promise.all(
    childrenDocs.map(child => buildTree(db, child.userCode, viewerCode, visited))
  );

  return {
    _id: user._id.toString(),
    fullName: user.fullName,
    userCode: user.userCode,
    mlmUserCode: user.userCode,
    level: user.level,
    saleValue: user.personalSales || 2000,   // fallback to static value
    children: children.filter(Boolean),
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userCode = url.searchParams.get("userCode") || "VANI001";
    const viewerCode = url.searchParams.get("viewerCode") || userCode;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DBNAME);

    const tree = await buildTree(db, userCode, viewerCode);
    if (!tree) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, tree });
  } catch (err) {
    console.error("Tree API error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}