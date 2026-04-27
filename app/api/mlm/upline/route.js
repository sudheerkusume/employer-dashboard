import clientPromise from "@/app/components/lib/db";

function normalizeAppId(id) {
    if (!id) return null;
    return id.toString().toUpperCase().replace(/\s+/g, '');
}

async function getUpline(db, appId, chain = []) {
    const user = await db.collection("marketing_applications").findOne({ applicationId: appId });
    if (!user) return chain;

    const referrerNorm = normalizeAppId(user.referredById);
    if (referrerNorm && referrerNorm !== appId) {
        const sponsor = await db.collection("marketing_applications").findOne({ applicationId: referrerNorm });
        if (sponsor) {
            chain.unshift(sponsor);
            return getUpline(db, referrerNorm, chain);
        }
    }
    return chain;
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let appId = url.searchParams.get("applicationId");
        let userCode = url.searchParams.get("userCode");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        // Resolve applicationId from userCode if needed
        if (!appId && userCode) {
            const user = await db.collection("marketing_applications").findOne({ userCode });
            if (user) appId = user.applicationId;
        }

        if (!appId) {
            return Response.json({ error: "applicationId or userCode required" }, { status: 400 });
        }

        const upline = await getUpline(db, appId);
        return Response.json({ success: true, upline });
    } catch (err) {
        console.error("Upline API error:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}