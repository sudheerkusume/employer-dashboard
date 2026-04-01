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
        const usersCol = db.collection("marketing_applications");

        // Step 1: Find the root user (excluding counters)
        const rootUser = await usersCol.findOne({
            $or: [
                { applicationId: identifier.toUpperCase() },
                { mlmUserCode: identifier },
                { userCode: identifier }
            ],
            _type: { $ne: "__counter" }
        });

        if (!rootUser) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Step 2: Fetch all users (excluding counters) and build maps
        const allUsers = await usersCol.find(
            { _type: { $ne: "__counter" } },
            {
                projection: {
                    _id: 1,
                    applicationId: 1,
                    userCode: 1,
                    mlmUserCode: 1,
                    fullName: 1,
                    level: 1,
                    status: 1,
                    wallet: 1,
                    referredById: 1,
                    email: 1,
                    contactNo: 1
                }
            }
        ).toArray();

        // Build maps for quick lookup
        const usersByAppId = new Map(); // applicationId -> user object
        const usersByMlmCode = new Map(); // mlmUserCode -> user object
        const childrenMap = new Map(); // referrerId -> array of user objects

        for (const user of allUsers) {
            const appId = user.applicationId;
            if (appId) usersByAppId.set(appId, user);
            const mlmCode = user.mlmUserCode;
            if (mlmCode) usersByMlmCode.set(mlmCode, user);

            const referrer = user.referredById;
            if (referrer) {
                if (!childrenMap.has(referrer)) childrenMap.set(referrer, []);
                childrenMap.get(referrer).push(user);
            }
        }

        // Step 3: Build tree recursively
        function buildTree(user, currentDepth, visited = new Set()) {
            const appId = user.applicationId;
            if (currentDepth >= depth || !appId) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: []
                };
            }

            // Prevent circular references
            if (visited.has(appId)) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: [],
                    note: "Circular reference detected"
                };
            }
            visited.add(appId);

            const children = childrenMap.get(appId) || [];
            const childrenWithSubtree = children.map(child =>
                buildTree(child, currentDepth + 1, new Set(visited))
            );

            return {
                _id: user._id.toString(),
                applicationId: user.applicationId,
                userCode: user.userCode,
                mlmUserCode: user.mlmUserCode,
                fullName: user.fullName,
                level: user.level || "Pending",
                status: user.status,
                wallet: user.wallet || 0,
                referredById: user.referredById,
                email: user.email,
                contactNo: user.contactNo,
                children: childrenWithSubtree
            };
        }

        // Step 4: Build tree from root
        const tree = buildTree(rootUser, 0);

        // Step 5: Calculate statistics using the children map
        const rootAppId = rootUser.applicationId;
        let directChildren = 0;
        let directByLevel = {};
        let totalDownline = 0;
        let totalByLevel = {};

        if (rootAppId) {
            const directList = childrenMap.get(rootAppId) || [];
            directChildren = directList.length;

            // Count direct by level
            directByLevel = {};
            for (const child of directList) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }

            // Recursively count downline
            function countDownline(userId) {
                const children = childrenMap.get(userId) || [];
                let count = children.length;
                const byLevel = {};
                for (const child of children) {
                    const level = child.level || 'ME';
                    byLevel[level] = (byLevel[level] || 0) + 1;
                    const childStats = countDownline(child.applicationId);
                    count += childStats.count;
                    for (const [lvl, cnt] of Object.entries(childStats.byLevel)) {
                        byLevel[lvl] = (byLevel[lvl] || 0) + cnt;
                    }
                }
                return { count, byLevel };
            }

            const downlineStats = countDownline(rootAppId);
            totalDownline = downlineStats.count;
            totalByLevel = downlineStats.byLevel;
        }

        return Response.json({
            success: true,
            tree,
            statistics: {
                directChildren,
                totalDownline,
                directByLevel,
                totalByLevel,
                level: rootUser.level || "Pending",
                status: rootUser.status
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}