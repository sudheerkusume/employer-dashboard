// app/api/mlm/user/route.js
import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // If a code is provided, return a single user
        if (code) {
            const user = await users.findOne({ userCode: code.toUpperCase() });

            if (!user) {
                return Response.json({ error: "User not found", success: false }, { status: 404 });
            }

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
        }

        // No code provided: return all users
        // Optionally add pagination: limit, skip, etc. (example: limit 50)
        const allUsers = await users.find({})
            .project({
                userCode: 1,
                fullName: 1,
                level: 1,
                email: 1,
                contactNo: 1,
                _id: 1
            })
            .toArray();

        return Response.json({
            success: true,
            users: allUsers,
            count: allUsers.length
        });

    } catch (err) {
        console.error("Error fetching user(s):", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}