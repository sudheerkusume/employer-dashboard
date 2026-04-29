import clientPromise from "@/app/components/lib/db";
import { NextResponse } from "next/server";

// Commission percentages per depth (same as in static component)
const COMMISSION_PERCENTS = { 1: 0.05, 2: 0.025, 3: 0.02, 4: 0.015, 5: 0.01, 6: 0.005 };
// Max depth a user can earn from based on their rank
const RANK_UNLOCKED_DEPTHS = { ME: 1, MM: 2, SMM: 3, DGM: 4, AGM: 5, GM: 6 };

// Helper: compute team sales, downline count, and depth sales
function computeDepthSalesAndDownline(userId, childrenMap, maxDepth = 6) {
    let totalDownlineCount = 0;
    const depthSales = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    function traverse(nodeId, depth) {
        if (depth > maxDepth) return;
        const children = childrenMap.get(nodeId) || [];
        for (const child of children) {
            totalDownlineCount++;
            const childSale = child.saleValue || 0;
            if (depth <= maxDepth) {
                depthSales[depth] = (depthSales[depth] || 0) + childSale;
            }
            traverse(child.applicationId, depth + 1);
        }
    }

    traverse(userId, 1);
    return { totalDownlineCount, depthSales };
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

        // Get logged‑in user
        const user = await col.findOne({ applicationId, _type: { $ne: "__counter" } });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Get all approved users for downline calculation
        const allUsers = await col.find(
            { status: "approved", _type: { $ne: "__counter" } },
            { projection: { applicationId: 1, referredById: 1, saleValue: 1, level: 1 } }
        ).toArray();

        // Build children map (referredById -> array of children)
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

        // Direct count
        const directCount = (childrenMap.get(applicationId) || []).length;

        // Compute depth sales and total downline (all depths 1-6)
        const { totalDownlineCount, depthSales } = computeDepthSalesAndDownline(applicationId, childrenMap, 6);

        // Commission based on user's own rank (only eligible depths)
        const userLevel = user.level || "ME";
        const maxDepth = RANK_UNLOCKED_DEPTHS[userLevel] || 1;
        let totalCommission = 0;
        const commissionByDepth = [];

        for (let depth = 1; depth <= 6; depth++) {
            const saleValue = depthSales[depth] || 0;
            const percent = COMMISSION_PERCENTS[depth] || 0;
            const commission = saleValue * percent;
            if (depth <= maxDepth) totalCommission += commission;
            commissionByDepth.push({
                depth,
                saleValue,
                percent: percent * 100,
                commission,
                eligible: depth <= maxDepth,
            });
        }

        // Team sales = sum of all downline sales (all depths)
        const teamSales = Object.values(depthSales).reduce((a, b) => a + b, 0);
        const personalSales = user.saleValue || 0;

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
                saleValue: personalSales,
                wallet: user.wallet || 0,
            },
            stats: {
                personalSales,
                teamSales,
                wallet: user.wallet || 0,
                directCount,
                totalDownline: totalDownlineCount,
            },
            commission: {
                total: totalCommission,
                breakdown: commissionByDepth,
                maxDepthEligible: maxDepth,
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}