// app/api/mlm/dashboard/route.js
import clientPromise from "@/app/components/lib/db";
import { NextResponse } from "next/server";

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

        // 1. Get the logged‑in user’s own document by applicationId
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

        // 2. Direct children count (referredById = this user’s applicationId)
        const directCount = await col.countDocuments({
            referredById: applicationId,
            status: "approved",   // only approved members count
            _type: { $ne: "__counter" }
        });

        // 3. Total downline (all descendants) – traverse by referredById
        let totalDownline = 0;
        let currentLevel = [applicationId];
        const visited = new Set([applicationId]);

        while (currentLevel.length > 0) {
            const nextLevel = [];
            const children = await col.find({
                referredById: { $in: currentLevel },
                status: "approved",
                _type: { $ne: "__counter" }
            }, { projection: { applicationId: 1 } }).toArray();

            for (const child of children) {
                if (!visited.has(child.applicationId)) {
                    visited.add(child.applicationId);
                    nextLevel.push(child.applicationId);
                    totalDownline++;
                }
            }
            currentLevel = nextLevel;
        }

        // 4. Personal sales & team sales – placeholder (replace with actual sums later)
        const personalSales = user.personalSales || 0;
        const teamSales = user.teamSales || 0;
        const wallet = user.wallet || 0;

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
            },
            stats: {
                personalSales,
                teamSales,
                wallet,
                directCount,
                totalDownline,
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