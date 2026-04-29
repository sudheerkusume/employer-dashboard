// app/api/mlm/dashboard/route.js
import clientPromise from "@/app/components/lib/db";
import { NextResponse } from "next/server";

// Commission percentages per depth (1-indexed)
const COMMISSION_PERCENTS = {
    1: 0.05,
    2: 0.025,
    3: 0.02,
    4: 0.015,
    5: 0.01,
    6: 0.005,
};

// Maximum depth a user can earn from based on their rank
const RANK_UNLOCKED_DEPTHS = {
    ME: 1,
    MM: 2,
    SMM: 3,
    DGM: 4,
    AGM: 5,
    GM: 6,
};

// Recursively compute commission and sales for a given user node
// using a pre-built children map
function computeStats(userId, childrenMap, userSaleValue, userLevel) {
    let teamSales = 0;
    // depthSales[depth] = total saleValue at that depth (depth 1 = direct children)
    const depthSales = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    function traverse(nodeId, depth) {
        if (depth > 6) return;
        const children = childrenMap.get(nodeId) || [];
        for (const child of children) {
            const childSale = child.saleValue || 0;
            teamSales += childSale;
            if (depth <= 6) {
                depthSales[depth] = (depthSales[depth] || 0) + childSale;
            }
            traverse(child.applicationId, depth + 1);
        }
    }

    traverse(userId, 1);

    // Calculate total commission based on user's rank (eligible depths)
    const maxDepth = RANK_UNLOCKED_DEPTHS[userLevel] || 1;
    let totalCommission = 0;
    for (let depth = 1; depth <= Math.min(maxDepth, 6); depth++) {
        const saleAmount = depthSales[depth] || 0;
        const commissionRate = COMMISSION_PERCENTS[depth] || 0;
        totalCommission += saleAmount * commissionRate;
    }

    return { teamSales, totalCommission, depthSales };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get("applicationId");

        if (!applicationId) {
            return NextResponse.json(
                { success: false, error: "applicationId is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const col = db.collection("marketing_applications");

        // 1. Get the logged‑in user’s own document
        const user = await col.findOne({
            applicationId,
            _type: { $ne: "__counter" }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // 2. Fetch all approved users (to build downline map)
        //    We need: applicationId, referredById, saleValue, level
        const allUsers = await col.find({
            status: "approved",
            _type: { $ne: "__counter" }
        }, {
            projection: {
                applicationId: 1,
                referredById: 1,
                saleValue: 1,
                level: 1
            }
        }).toArray();

        // Build children map: referredById -> array of children objects
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

        // 3. Compute direct count
        const directCount = (childrenMap.get(applicationId) || []).length;

        // 4. Compute team sales and total commission
        const userSaleValue = user.saleValue || 0;
        const userLevel = user.level || "ME";
        const { teamSales, totalCommission, depthSales } = computeStats(
            applicationId,
            childrenMap,
            userSaleValue,
            userLevel
        );

        // Personal sales is the user's own sale value
        const personalSales = userSaleValue;

        // Wallet balance - you may have a separate collection for withdrawals/earnings.
        // For now, we can store wallet in user document.
        const wallet = user.wallet || 0;

        // Optional: Also return depth breakdown for debugging
        const depthBreakdown = Object.entries(depthSales)
            .filter(([, val]) => val > 0)
            .map(([depth, amount]) => ({
                depth: parseInt(depth),
                saleAmount: amount,
                commissionRate: COMMISSION_PERCENTS[depth] * 100,
                commissionEarned: amount * (COMMISSION_PERCENTS[depth] || 0),
            }));

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
                wallet,
            },
            stats: {
                personalSales,
                teamSales,
                wallet,
                directCount,
                totalDownline: teamSales > 0 ? "computed from children" : 0, // we can compute total downline count if needed separately
            },
            commission: {
                total: totalCommission,
                depthBreakdown,
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}