// app/api/mlm/tree/route.js

import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const identifier = url.searchParams.get("userCode");
        const depth = parseInt(url.searchParams.get("depth")) || 5;

        if (!identifier) {
            return Response.json({ error: "User code or application ID required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // Find the root user by either mlmUserCode (approved) or applicationId (pending)
        const rootUser = await users.findOne({
            $or: [
                { mlmUserCode: identifier },
                { applicationId: identifier.toUpperCase() }
            ]
        });

        if (!rootUser) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Recursive function to build the tree
        async function buildTree(user, currentDepth) {
            if (currentDepth >= depth) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: []
                };
            }

            // Find direct downlines: users whose sponsorCode equals this user's mlmUserCode
            // (only approved users have mlmUserCode; pending users have none, so no children)
            let children = [];
            if (user.mlmUserCode) {
                children = await users.find({ sponsorCode: user.mlmUserCode }).toArray();
            }

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1))
            );

            return {
                ...user,
                _id: user._id.toString(),
                children: childrenWithSubtree
            };
        }

        const tree = await buildTree(rootUser, 0);

        // Helper to count total downline (including indirect)
        async function countDownline(userCode) {
            const directChildren = await users.find({ sponsorCode: userCode }).toArray();
            let total = directChildren.length;
            for (const child of directChildren) {
                if (child.mlmUserCode) {
                    total += await countDownline(child.mlmUserCode);
                }
            }
            return total;
        }

        let directChildren = 0;
        let totalDownline = 0;
        if (rootUser.mlmUserCode) {
            directChildren = await users.countDocuments({ sponsorCode: rootUser.mlmUserCode });
            totalDownline = await countDownline(rootUser.mlmUserCode);
        }

        return Response.json({
            success: true,
            tree,
            statistics: {
                directChildren,
                totalDownline,
                level: rootUser.level || "ME",   // default if not set
                // wallet: rootUser.wallet        // if you have a wallet field
            }
        });

    } catch (err) {
        console.log("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}