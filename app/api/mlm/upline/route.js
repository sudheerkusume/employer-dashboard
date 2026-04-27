import clientPromise from "@/app/components/lib/db";


async function getUpline(db, userCode, chain = []) {
    const user = await db.collection("marketing_applications").findOne({ userCode });
    if (!user) return chain;

    if (user.sponsorCode) {
        const sponsor = await db.collection("marketing_applications").findOne({ userCode: user.sponsorCode });
        if (sponsor) {
            chain.unshift({
                _id: sponsor._id.toString(),
                fullName: sponsor.fullName,
                userCode: sponsor.userCode,
                level: sponsor.level,
            });
            return getUpline(db, user.sponsorCode, chain);
        }
    }
    return chain;
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userCode = url.searchParams.get("userCode");

        if (!userCode) {
            return Response.json({ success: false, error: "userCode required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        // Optional: add authentication check here to ensure only super admins can access upline.
        // For example, verify a session token or API key.
        // For simplicity, we rely on frontend to call this only for super admin.

        const upline = await getUpline(db, userCode);
        return Response.json({ success: true, upline });
    } catch (err) {
        console.error("Upline API error:", err);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}