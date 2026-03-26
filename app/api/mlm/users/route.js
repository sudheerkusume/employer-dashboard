// app/api/mlm/user/route.js
import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");

        if (!code) {
            return Response.json({ error: "User code required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        const user = await users.findOne({ userCode: code.toUpperCase() });

        if (!user) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Return only necessary fields
        return Response.json({
            success: true,
            user: {
                userCode: user.userCode,
                fullName: user.fullName,
                level: user.level,
                email: user.email,
                contactNo: user.contactNo,
            }
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}