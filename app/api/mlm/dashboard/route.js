// app/api/mlm/dashboard/route.js
import clientPromise from "@/app/components/lib/db";
import { NextResponse } from "next/server";

const COMMISSION_PERCENTS = { 1: 0.05, 2: 0.025, 3: 0.02, 4: 0.015, 5: 0.01, 6: 0.005 };
const RANK_UNLOCKED_DEPTHS = { ME: 1, MM: 2, SMM: 3, DGM: 4, AGM: 5, GM: 6 };

function computeStats(userId, childrenMap) {
    let teamSales = 0;
    let totalDownlineCount = 0;
    const depthSales = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    function traverse(nodeId, depth) {
        if (depth > 6) return;
        const children = childrenMap.get(nodeId) || [];
        for (const child of children) {
            totalDownlineCount++;
            const childSale = child.saleValue || 0;
            teamSales += childSale;
            if (depth <= 6) depthSales[depth] = (depthSales[depth] || 0) + childSale;
            traverse(child.applicationId, depth + 1);
        }
    }

    traverse(userId, 1);
    return { teamSales, totalDownlineCount, depthSales };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get("applicationId");

        if (!applicationId) {
            return NextResponse.json({ success: false, error: "applicationId is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        const user = await col.findOne({ applicationId, _type: { $ne: "__counter" } });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Fetch all approved users for downline calculation
        const allUsers = await col.find(
            { status: "approved", _type: { $ne: "__counter" } },
            { projection: { applicationId: 1, referredById: 1, saleValue: 1, level: 1 } }
        ).toArray();

        // Build children map: referredById -> array of children
        const childrenMap = new Map();
        for (const doc of allUsers) {
            const refId = doc.referredById;
            if (!refId) continue;
            if (!childrenMap.has(refId)) childrenMap.set(refId, []);
            childrenMap.get(refId).push({
                applicationId: doc.applicationId,
                saleValue: doc.saleValue || 0,
                level: doc.level || "ME",
            });
        }

        const directCount = (childrenMap.get(applicationId) || []).length;
        const userSaleValue = user.saleValue || 0;
        const userLevel = user.level || "ME";
        const { teamSales, totalDownlineCount, depthSales } = computeStats(applicationId, childrenMap);

        // Commission calculation based on user's rank (eligible depths)
        const maxDepth = RANK_UNLOCKED_DEPTHS[userLevel] || 1;
        let totalCommission = 0;
        for (let depth = 1; depth <= Math.min(maxDepth, 6); depth++) {
            totalCommission += (depthSales[depth] || 0) * (COMMISSION_PERCENTS[depth] || 0);
        }

        return NextResponse.json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                applicationId: user.applicationId,
                userCode: user.userCode,
                level: user.level,
                referredById: user.referredById,
                status: user.status,
                saleValue: userSaleValue,
                wallet: user.wallet || 0,
            },
            stats: {
                personalSales: userSaleValue,
                teamSales,
                wallet: user.wallet || 0,
                directCount,
                totalDownline: totalDownlineCount,
            },
            commission: {
                total: totalCommission,
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}