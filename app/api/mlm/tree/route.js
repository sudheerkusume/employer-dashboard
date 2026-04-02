import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let targetIdentifier = url.searchParams.get("userCode");
        const currentUserCode = url.searchParams.get("userCode");
        const depth = parseInt(url.searchParams.get("depth")) || 5;

        // --- Validate current user ---
        if (!currentUserCode) {
            return Response.json(
                { error: "currentUserCode is required", success: false },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // Find the current logged-in user
        const currentUser = await users.findOne({
            $or: [
                { applicationId: currentUserCode.toUpperCase() },
                { mlmUserCode: currentUserCode },
                { userCode: currentUserCode }
            ],
            _type: { $ne: "__counter" }
        });

        if (!currentUser) {
            return Response.json(
                { error: "Current user not found", success: false },
                { status: 404 }
            );
        }

        // Determine if current user is admin (RB000001 or role "admin")
        const isAdmin = currentUser.applicationId === "RB000001" || currentUser.role === "admin";

        // If target not provided, default based on role
        if (!targetIdentifier) {
            if (isAdmin) {
                targetIdentifier = "RB000001";
            } else {
                targetIdentifier = currentUser.applicationId;
            }
        }

        // --- Authorization for non-admin users ---
        if (!isAdmin) {
            const isSelf = (
                targetIdentifier.toUpperCase() === currentUser.applicationId?.toUpperCase() ||
                targetIdentifier === currentUser.userCode ||
                targetIdentifier === currentUser.mlmUserCode
            );
            if (!isSelf) {
                return Response.json(
                    { error: "Forbidden: you can only view your own downline", success: false },
                    { status: 403 }
                );
            }
        }

        // --- Find the target root user (whose tree we will build) ---
        const rootUser = await users.findOne({
            $or: [
                { applicationId: targetIdentifier.toUpperCase() },
                { mlmUserCode: targetIdentifier },
                { userCode: targetIdentifier }
            ],
            _type: { $ne: "__counter" }
        });

        if (!rootUser) {
            return Response.json(
                { error: "Target user not found", success: false },
                { status: 404 }
            );
        }

        // --- Existing recursive tree building (unchanged) ---
        async function buildTree(user, currentDepth, visited = new Set()) {
            if (currentDepth >= depth || !user.applicationId) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: []
                };
            }
            if (visited.has(user.applicationId)) {
                return {
                    ...user,
                    _id: user._id.toString(),
                    children: [],
                    note: "Circular reference detected"
                };
            }
            visited.add(user.applicationId);

            const children = await users.find({
                $or: [
                    { referredById: user.applicationId },
                    { referredById: user.mlmUserCode }
                ],
                _type: { $ne: "__counter" }
            }).toArray();

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1, new Set(visited)))
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

        // --- Statistics helper (unchanged) ---
        async function getDownlineStats(userId, userMlmCode) {
            const directChildren = await users.find({
                $or: [
                    { referredById: userId },
                    { referredById: userMlmCode }
                ],
                _type: { $ne: "__counter" }
            }).toArray();
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
                    const childStats = await getDownlineStats(child.applicationId, child.mlmUserCode);
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
            const directList = await users.find({
                $or: [
                    { referredById: rootUser.applicationId },
                    { referredById: rootUser.mlmUserCode }
                ],
                _type: { $ne: "__counter" }
            }).toArray();
            directChildren = directList.length;
            directByLevel = {};
            for (const child of directList) {
                const level = child.level || 'ME';
                directByLevel[level] = (directByLevel[level] || 0) + 1;
            }
            const downlineStats = await getDownlineStats(rootUser.applicationId, rootUser.mlmUserCode);
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
                level: rootUser.level || "Pending",
                status: rootUser.status
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}