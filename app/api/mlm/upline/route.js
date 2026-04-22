// app/api/mlm/upline/route.js
import clientPromise from "@/app/components/lib/db";

async function getUpline(db, userCode, chain = []) {
  const user = await db.collection("marketing_applications").findOne({ userCode });
  if (!user) return chain;
  if (user.sponsorCode) {
    const sponsor = await db.collection("marketing_applications").findOne({ userCode: user.sponsorCode });
    if (sponsor) {
      chain.unshift(sponsor);
      return getUpline(db, user.sponsorCode, chain);
    }
  }
  return chain;
}

export async function GET(req) {
  const url = new URL(req.url);
  const userCode = url.searchParams.get("userCode");
  if (!userCode) return Response.json({ error: "userCode required" }, { status: 400 });

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DBNAME);
  const upline = await getUpline(db, userCode);
  return Response.json({ success: true, upline });
}