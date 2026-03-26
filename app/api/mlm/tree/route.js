// app/api/mlm/tree/route.js

import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userCode = url.searchParams.get("userCode");
        const depth = parseInt(url.searchParams.get("depth")) || 5;

        if (!userCode) {
            return Response.json({ error: "User code required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("mlm_users");

        // Find the user
        const rootUser = await users.findOne({ userCode });
        if (!rootUser) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Build tree recursively
        async function buildTree(user, currentDepth) {
            if (currentDepth >= depth) {
                return {
                    ...user,
                    children: []
                };
            }

            const children = await users.find({ referrerCode: user.userCode }).toArray();

            const childrenWithSubtree = await Promise.all(
                children.map(child => buildTree(child, currentDepth + 1))
            );

            return {
                ...user,
                children: childrenWithSubtree
            };
        }

        const tree = await buildTree(rootUser, 0);

        // Get statistics
        const totalChildren = await users.countDocuments({ referrerCode: userCode });
        const totalDownline = await users.countDocuments({ rootId: userCode });

        return Response.json({
            success: true,
            tree: {
                ...tree,
                _id: tree._id.toString()
            },
            statistics: {
                directChildren: totalChildren,
                totalDownline: totalDownline,
                level: rootUser.level,
                wallet: rootUser.wallet
            }
        });

    } catch (err) {
        console.error("❌ Error fetching tree:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}