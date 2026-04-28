import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const identifier = url.searchParams.get("userId");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const applications = db.collection("marketing_applications");

        // If an identifier is provided
        if (identifier) {
            // Case-insensitive search without altering stored data
            const user = await applications.findOne({
                $or: [
                    { applicationId: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                    { mlmUserCode: { $regex: new RegExp(`^${identifier}$`, 'i') } }
                ],
                _type: { $ne: "__counter" }
            });

            if (!user) {
                // Optional: log the tried identifier for debugging
                console.log(`User not found with identifier: ${identifier}`);
                return Response.json({ error: "User not found", success: false }, { status: 404 });
            }

            return Response.json({
                success: true,
                user: {
                    userCode: user.mlmUserCode || user.applicationId,
                    applicationId: user.applicationId,
                    fullName: user.fullName,
                    level: user.level || "ME",
                    email: user.email,
                    role: user.role,
                    contactNo: user.contactNo,
                }
            });
        }

        // No identifier – return all users
        const allUsers = await applications.find({ _type: { $ne: "__counter" } })
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