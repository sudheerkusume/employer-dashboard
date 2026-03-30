// app/api/mlm/tree/route.js

import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const identifier = url.searchParams.get("userCode");
        const depth = parseInt(url.searchParams.get("depth")) || 5;  // Max tree depth

        if (!identifier) {
            return Response.json({ error: "User code or application ID required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // Find root user by either mlmUserCode (approved) or applicationId (pending)
        const rootUser = await users.findOne({
            $or: [
                { mlmUserCode: identifier },
                { applicationId: identifier.toUpperCase() }
            ]
        });

        if (!rootUser) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Recursive function to build the tree, respecting max depth
        async function buildTree(user, currentDepth, visited = new Set()) {
            if (currentDepth >= depth || !user.mlmUserCode) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: []
                };
            }

            // Prevent circular references (should not happen in a proper MLM tree)
            if (visited.has(user.mlmUserCode)) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: [],
                    note: "Circular reference detected, children truncated"
                };
            }
            visited.add(user.mlmUserCode);

            // Fetch direct downlines (users whose sponsorCode equals this user's mlmUserCode)
            const children = await users.find({ sponsorCode: user.mlmUserCode }).toArray();

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1, new Set(visited)))
            );

            return {
                ...user,
                _id: user._id.toString(),
                children: childrenWithSubtree
            };
        }

        // Helper to count total downline (including indirect) by level
        async function getDownlineStats(userCode) {
            const directChildren = await users.find({ sponsorCode: userCode }).toArray();
            const directCount = directChildren.length;

            // Count direct children by level
            const directByLevel = {};
            for (const child of directChildren) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }

            // Recursively count total downline (indirect) and accumulate by level
            let totalCount = directCount;
            const totalByLevel = { ...directByLevel };

            for (const child of directChildren) {
                if (child.mlmUserCode) {
                    const childStats = await getDownlineStats(child.mlmUserCode);
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

        if (rootUser.mlmUserCode) {
            const directList = await users.find({ sponsorCode: rootUser.mlmUserCode }).toArray();
            directChildren = directList.length;

            // Count direct children by level
            directByLevel = {};
            for (const child of directList) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }

            // Get total downline stats (including indirect)
            const downlineStats = await getDownlineStats(rootUser.mlmUserCode);
            totalDownline = downlineStats.totalCount;
            totalByLevel = downlineStats.totalByLevel;
        }

        // Build the tree
        const tree = await buildTree(rootUser, 0);

        return Response.json({
            success: true,
            tree,
            statistics: {
                directChildren,               // Number of direct downlines
                totalDownline,               // Total downlines (direct + indirect)
                directByLevel,               // Count of direct downlines per level
                totalByLevel,                // Count of total downlines per level (including indirect)
                level: rootUser.level || "ME",
                // wallet: rootUser.wallet   // optional if you have a wallet field
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}