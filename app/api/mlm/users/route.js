import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const identifier = url.searchParams.get("userId"); // could be either appId or userCode

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // If an identifier is provided, search both fields
        if (identifier) {
            const user = await applications.findOne({
                $or: [
                    { applicationId: identifier.toUpperCase() },
                    { mlmUserCode: identifier.toUpperCase() }
                ]
            });

            if (!user) {
                return Response.json({ error: "User not found", success: false }, { status: 404 });
            }

            // Return user data for login
            return Response.json({
                success: true,
                user: {
                    userCode: user.mlmUserCode || user.applicationId, // use mlmUserCode if exists, else appId
                    applicationId: user.applicationId,
                    fullName: user.fullName,
                    level: user.level || "ME",          // default if not yet approved
                    email: user.email,
                    role: user.role,
                    contactNo: user.contactNo,
                }
            });
        }

        // No identifier: return all applications (admin list)
        const allUsers = await applications.find({})
            .project({
                applicationId: 1,
                fullName: 1,
                level: 1,
                email: 1,
                contactNo: 1,
                mlmUserCode: 1,
                _id: 0
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