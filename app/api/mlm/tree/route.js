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

        // Find root user: by applicationId (primary) or mlmUserCode (secondary)
        const rootUser = await users.findOne({
            $or: [
                { applicationId: identifier.toUpperCase() },
                { mlmUserCode: identifier }
            ]
        });

        if (!rootUser) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Recursive function to build the tree
        async function buildTree(user, currentDepth, visited = new Set()) {
            if (currentDepth >= depth || !user.applicationId) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: []
                };
            }

            // Prevent circular references
            if (visited.has(user.applicationId)) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: [],
                    note: "Circular reference detected, children truncated"
                };
            }
            visited.add(user.applicationId);

            // Fetch direct downlines: those whose sponsorCode equals this user's applicationId
            const children = await users.find({ sponsorCode: user.applicationId }).toArray();

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1, new Set(visited)))
            );

            return {
                ...user,
                _id: user._id.toString(),
                children: childrenWithSubtree
            };
        }

        // Helper to count downline stats by level
        async function getDownlineStats(userId) {
            const directChildren = await users.find({ sponsorCode: userId }).toArray();
            const directCount = directChildren.length;

            const directByLevel = {};
            for (const child of directChildren) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }

            let totalCount = directCount;
            const totalByLevel = { ...directByLevel };

            for (const child of directChildren) {
                if (child.applicationId) {
                    const childStats = await getDownlineStats(child.applicationId);
                    totalCount += childStats.totalCount;
                    for (const [level, cnt] of Object.entries(childStats.totalByLevel)) {
                        totalByLevel[level] = (totalByLevel[level] || 0) + cnt;
                    }
                }
            }

            return { totalCount, totalByLevel };
        }

        let directChildren = 0;
        let totalDownline = 0;
        let directByLevel = {};
        let totalByLevel = {};

        if (rootUser.applicationId) {
            const directList = await users.find({ sponsorCode: rootUser.applicationId }).toArray();
            directChildren = directList.length;

            directByLevel = {};
            for (const child of directList) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }

            const downlineStats = await getDownlineStats(rootUser.applicationId);
            totalDownline = downlineStats.totalCount;
            totalByLevel = downlineStats.totalByLevel;
        }

        const tree = await buildTree(rootUser, 0);

        return Response.json({
            success: true,
            tree,
            statistics: {
                directChildren,
                totalDownline,
                directByLevel,
                totalByLevel,
                level: rootUser.level || "ME",
                // wallet: rootUser.wallet
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}