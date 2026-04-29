import clientPromise from "@/app/components/lib/db";
import { NextResponse } from "next/server";

// Commission percentages per depth (1 = direct children, 2 = depth 2, etc.)
const COMMISSION_PERCENTS = { 1: 0.05, 2: 0.025, 3: 0.02, 4: 0.015, 5: 0.01, 6: 0.005 };
const DEFAULT_SALE_VALUE = 2000;

// Compute total downline count and cumulative sale value per depth
function computeDepthSalesAndDownline(userId, childrenMap, maxDepth = 6) {
    let totalDownlineCount = 0;
    const depthSales = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    function traverse(nodeId, depth) {
        if (depth > maxDepth) return;
        const children = childrenMap.get(nodeId) || [];
        for (const child of children) {
            totalDownlineCount++;
            const childSale = child.saleValue ?? DEFAULT_SALE_VALUE;
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

        // 1. Get the logged‑in user
        const user = await col.findOne({ applicationId, _type: { $ne: "__counter" } });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // 2. Get all approved users (downline members)
        const allUsers = await col.find(
            { status: "approved", _type: { $ne: "__counter" } },
            { projection: { applicationId: 1, referredById: 1, saleValue: 1, level: 1 } }
        ).toArray();

        // 3. Build children map (referredById → array of children)
        const childrenMap = new Map();
        for (const doc of allUsers) {
            const refId = doc.referredById;
            if (!refId) continue;
            if (!childrenMap.has(refId)) childrenMap.set(refId, []);
            childrenMap.get(refId).push({
                applicationId: doc.applicationId,
                saleValue: doc.saleValue ?? DEFAULT_SALE_VALUE,
                level: doc.level || "ME",
            });
        }

        // 4. Direct count
        const directCount = (childrenMap.get(applicationId) || []).length;

        // 5. Compute depth sales and total downline count
        const { totalDownlineCount, depthSales } = computeDepthSalesAndDownline(applicationId, childrenMap, 6);

        // 6. Commission for ALL depths (no rank restriction)
        let totalCommission = 0;
        const commissionByDepth = [];

        for (let depth = 1; depth <= 6; depth++) {
            const saleValue = depthSales[depth] || 0;
            const percent = COMMISSION_PERCENTS[depth] || 0;
            const commission = saleValue * percent;
            totalCommission += commission;
            commissionByDepth.push({
                depth,
                saleValue,
                percent: percent * 100,
                commission,
                eligible: true,   // now all depths count
            });
        }

        // 7. Team sales = sum of all downline sales (all depths)
        const teamSales = Object.values(depthSales).reduce((a, b) => a + b, 0);
        const personalSales = user.saleValue ?? DEFAULT_SALE_VALUE;
        const wallet = user.wallet ?? 0;

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
                wallet,
            },
            stats: {
                personalSales,
                teamSales,
                wallet,
                directCount,
                totalDownline: totalDownlineCount,
            },
            commission: {
                total: totalCommission,
                breakdown: commissionByDepth,
                maxDepthEligible: 6,
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}