// app/api/mlm/user/route.js
import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const applicationId = url.searchParams.get("applicationId");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // If a applicationId is provided, return a single user
        if (applicationId) {
            const user = await users.findOne({ applicationId: applicationId.toUpperCase() });

            if (!user) {
                return Response.json({ error: "User not found", success: false }, { status: 404 });
            }

            return Response.json({
                success: true,
                user: {
                    applicationId: user.applicationId,
                    fullName: user.fullName,
                    level: user.level,
                    email: user.email,
                    contactNo: user.contactNo,
                }
            });
        }

        // No applicationId provided: return all users
        // Optionally add pagination: limit, skip, etc. (example: limit 50)
        const allUsers = await users.find({})
            .project({
                applicationId: 1,
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
        console.log("Error fetching user(s):", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}