// app/api/mlm/tree/route.js
import clientPromise from "@/app/components/lib/db";

// Helper: Determine level based on number of direct referrals (or total downline)
// You can adjust the thresholds as per your business rules
function determineLevelByReferrals(directCount, totalDownline) {
    if (directCount >= 10 && totalDownline >= 100) return "GM";
    if (directCount >= 5 && totalDownline >= 30) return "DGM";
    if (directCount >= 3 && totalDownline >= 15) return "AGM";
    if (directCount >= 2 && totalDownline >= 5) return "SMM";
    if (directCount >= 1 && totalDownline >= 1) return "MM";
    return "ME";
}

// Helper: Recursively get total downline count and direct children
async function getDownlineStats(db, userId, userMlmCode) {
    const directChildren = await db.collection("marketing_applications").find({
        $or: [{ referredById: userId }, { referredById: userMlmCode }]
    }).toArray();
    let totalCount = directChildren.length;
    for (const child of directChildren) {
        const childStats = await getDownlineStats(db, child.applicationId, child.mlmUserCode);
        totalCount += childStats.totalCount;
    }
    return { totalCount, directChildren };
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        let targetIdentifier = url.searchParams.get("userCode");
        const currentUserCode = url.searchParams.get("userCode");
        const depth = parseInt(url.searchParams.get("depth")) || 5;
        const autoAssignLevel = url.searchParams.get("autoAssignLevel") === "true"; // optional

        if (!currentUserCode) {
            return Response.json({ error: "currentUserCode is required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");

        // Find current user
        const currentUser = await users.findOne({
            $or: [
                { applicationId: currentUserCode.toUpperCase() },
                { mlmUserCode: currentUserCode },
                { userCode: currentUserCode }
            ]
        });
        if (!currentUser) {
            return Response.json({ error: "Current user not found", success: false }, { status: 404 });
        }

        const isAdmin = currentUser.applicationId === "RB000001" || currentUser.role === "admin";

        if (!targetIdentifier) {
            targetIdentifier = isAdmin ? "RB000001" : currentUser.applicationId;
        }

        // Authorization
        if (!isAdmin) {
            const isSelf = (
                targetIdentifier.toUpperCase() === currentUser.applicationId?.toUpperCase() ||
                targetIdentifier === currentUser.userCode ||
                targetIdentifier === currentUser.mlmUserCode
            );
            if (!isSelf) {
                return Response.json({ error: "Forbidden: you can only view your own downline", success: false }, { status: 403 });
            }
        }

        // Find root user
        let rootUser = await users.findOne({
            $or: [
                { applicationId: targetIdentifier.toUpperCase() },
                { mlmUserCode: targetIdentifier },
                { userCode: targetIdentifier }
            ]
        });
        if (!rootUser && targetIdentifier === "RB000001") {
            return Response.json({ error: "Root user RB000001 not found in database", success: false }, { status: 404 });
        }
        if (!rootUser) {
            return Response.json({ error: "Target user not found", success: false }, { status: 404 });
        }

        // Optional: Auto‑assign level if requested
        if (autoAssignLevel && rootUser.applicationId) {
            const stats = await getDownlineStats(db, rootUser.applicationId, rootUser.mlmUserCode);
            const newLevel = determineLevelByReferrals(stats.directChildren.length, stats.totalCount);
            if (newLevel !== rootUser.level) {
                await users.updateOne(
                    { _id: rootUser._id },
                    { $set: { level: newLevel } }
                );
                rootUser.level = newLevel;
            }
        }

        // Recursive tree builder
        async function buildTree(user, currentDepth, visited = new Set()) {
            if (currentDepth >= depth) {
                return { ...user, _id: user._id.toString(), children: [] };
            }
            if (visited.has(user.applicationId)) {
                return { ...user, _id: user._id.toString(), children: [], note: "Circular reference" };
            }
            visited.add(user.applicationId);

            const children = await users.find({
                $or: [
                    { referredById: user.applicationId },
                    { referredById: user.mlmUserCode }
                ]
            }).toArray();

            // Optionally auto‑assign level for each child
            if (autoAssignLevel) {
                for (const child of children) {
                    const childStats = await getDownlineStats(db, child.applicationId, child.mlmUserCode);
                    const newLevel = determineLevelByReferrals(childStats.directChildren.length, childStats.totalCount);
                    if (newLevel !== child.level) {
                        await users.updateOne({ _id: child._id }, { $set: { level: newLevel } });
                        child.level = newLevel;
                    }
                }
            }

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1, new Set(visited)))
            );

            return {
                _id: user._id.toString(),
                applicationId: user.applicationId,
                userCode: user.userCode,
                mlmUserCode: user.mlmUserCode,
                fullName: user.fullName,
                level: user.level || "ME",
                status: user.status,
                wallet: user.wallet || 0,
                referredById: user.referredById,
                email: user.email,
                contactNo: user.contactNo,
                children: childrenWithSubtree
            };
        }

        // Statistics (direct children & total downline)
        async function getFullStats(userId, userMlmCode) {
            const directList = await users.find({
                $or: [{ referredById: userId }, { referredById: userMlmCode }]
            }).toArray();
            const directCount = directList.length;
            const directByLevel = {};
            for (const child of directList) {
                const lvl = child.level || "ME";
                directByLevel[lvl] = (directByLevel[lvl] || 0) + 1;
            }
            let totalCount = directCount;
            const totalByLevel = { ...directByLevel };
            for (const child of directList) {
                if (child.applicationId) {
                    const childStats = await getFullStats(child.applicationId, child.mlmUserCode);
                    totalCount += childStats.totalCount;
                    for (const [lvl, cnt] of Object.entries(childStats.totalByLevel)) {
                        totalByLevel[lvl] = (totalByLevel[lvl] || 0) + cnt;
                    }
                }
            }
            return { directCount, totalCount, directByLevel, totalByLevel };
        }

        const stats = await getFullStats(rootUser.applicationId, rootUser.mlmUserCode);
        const tree = await buildTree(rootUser, 0);

        return Response.json({
            success: true,
            tree,
            statistics: {
                directChildren: stats.directCount,
                totalDownline: stats.totalCount,
                directByLevel: stats.directByLevel,
                totalByLevel: stats.totalByLevel,
                level: rootUser.level || "ME",
                status: rootUser.status
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}