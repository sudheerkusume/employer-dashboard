// app/api/mlm/commission/route.js

import clientPromise from "@/app/components/lib/db";
import { COMMISSION_CONFIG, calculateCommission } from "@/app/components/lib/mlmUtils";
import { ObjectId } from "mongodb";

// Commission distribution function
async function distributeCommission(db, userCode, amount, saleId) {
    const users = db.collection("marketing_applications");
    const commissions = db.collection("mlm_commissions");

    let current = await users.findOne({ mlmUserCode: userCode });
    let prevPercent = 0;
    let level = 0;

    while (current && current.status === "active") {
        const currentPercent = COMMISSION_CONFIG[current.level] || 0;
        const diff = currentPercent - prevPercent;

        if (diff > 0) {
            const commissionAmount = calculateCommission(diff, amount);

            if (commissionAmount > 0) {
                // Create commission record
                const commissionRecord = {
                    _id: new ObjectId(),
                    userId: current._id,
                    userCode: current.mlmUserCode,
                    level: current.level,
                    saleId,
                    saleAmount: amount,
                    commissionAmount,
                    percentage: diff,
                    createdAt: new Date().toISOString()
                };

                await commissions.insertOne(commissionRecord);

                // Update user wallet and total commission
                await users.updateOne(
                    { _id: current._id },
                    {
                        $inc: {
                            wallet: commissionAmount,
                            totalCommission: commissionAmount,
                            teamSales: amount
                        }
                    }
                );
            }
        }

        prevPercent = currentPercent;
        level++;

        // Stop after 6 levels (GM)
        if (level >= 6) break;

        if (!current.sponsorCode) break;
        current = await users.findOne({ mlmUserCode: current.sponsorCode });
    }
}

// GET: Fetch user commissions
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const identifier = url.searchParams.get("userCode"); // can be applicationId or mlmUserCode
        const fromDate = url.searchParams.get("fromDate");
        const toDate = url.searchParams.get("toDate");
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 50;

        if (!identifier) {
            return Response.json({ error: "User code required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");
        const commissions = db.collection("mlm_commissions");

        // Find the user by either applicationId or mlmUserCode
        const user = await users.findOne({
            $or: [
                { mlmUserCode: identifier },
                { applicationId: identifier.toUpperCase() }
            ]
        });

        if (!user) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // If the user is not approved yet, no commissions exist
        if (!user.mlmUserCode) {
            return Response.json({
                success: true,
                commissions: [],
                totalCommission: 0,
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalRecords: 0,
                    limit
                }
            });
        }

        // Build filter for commissions using the mlmUserCode
        let filter = { userCode: user.mlmUserCode };

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate).toISOString();
            if (toDate) filter.createdAt.$lte = new Date(toDate).toISOString();
        }

        const skip = (page - 1) * limit;
        const total = await commissions.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const results = await commissions
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Calculate total commission
        const totalCommission = await commissions.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]).toArray();

        return Response.json({
            success: true,
            commissions: results,
            totalCommission: totalCommission[0]?.total || 0,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords: total,
                limit
            }
        });

    } catch (err) {
        console.log("❌ Error fetching commissions:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}

// POST: Record sale and distribute commission
export async function POST(req) {
    try {
        const body = await req.json();
        const { userCode: identifier, amount, description, productId } = body;

        if (!identifier || !amount) {
            return Response.json({ error: "User code and amount required", success: false }, { status: 400 });
        }

        if (amount <= 0) {
            return Response.json({ error: "Amount must be greater than 0", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");
        const sales = db.collection("mlm_sales");

        // Find the user by either applicationId or mlmUserCode
        const user = await users.findOne({
            $or: [
                { mlmUserCode: identifier },
                { applicationId: identifier.toUpperCase() }
            ]
        });

        if (!user) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // Must have an mlmUserCode (approved) to record a sale
        if (!user.mlmUserCode) {
            return Response.json({ error: "User not approved yet", success: false }, { status: 400 });
        }

        if (user.status !== "active") {
            return Response.json({ error: "User is not active", success: false }, { status: 400 });
        }

        // Create sale record
        const sale = {
            _id: new ObjectId(),
            userId: user._id,
            userCode: user.mlmUserCode,
            amount,
            description: description || "Product sale",
            productId: productId || null,
            status: "completed",
            createdAt: new Date().toISOString()
        };

        await sales.insertOne(sale);

        // Update user's personal sales
        await users.updateOne(
            { _id: user._id },
            { $inc: { personalSales: amount } }
        );

        // Distribute commission (using mlmUserCode)
        await distributeCommission(db, user.mlmUserCode, amount, sale._id.toString());

        // Check for level promotion (optional – your promote logic may be elsewhere)
        // ... (we can add promotion check here if needed)

        const updatedUser = await users.findOne({ _id: user._id });

        return Response.json({
            success: true,
            message: "Sale recorded and commissions distributed",
            sale: sale,
            user: {
                userCode: updatedUser.mlmUserCode,
                level: updatedUser.level,
                personalSales: updatedUser.personalSales,
                wallet: updatedUser.wallet
            }
        });

    } catch (err) {
        console.log("❌ Error recording sale:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}