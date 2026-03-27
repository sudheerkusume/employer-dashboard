// app/api/mlm/sales/route.js

import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userCodeParam = url.searchParams.get("userCode"); // can be applicationId or mlmUserCode
        const fromDate = url.searchParams.get("fromDate");
        const toDate = url.searchParams.get("toDate");
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 50;

        if (!userCodeParam) {
            return Response.json({ error: "User code required", success: false }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const users = db.collection("marketing_applications");
        const sales = db.collection("mlm_sales");

        // Find the user by either applicationId or mlmUserCode
        const user = await users.findOne({
            $or: [
                { mlmUserCode: userCodeParam },
                { applicationId: userCodeParam.toUpperCase() }
            ]
        });

        if (!user) {
            return Response.json({ error: "User not found", success: false }, { status: 404 });
        }

        // If the user is not approved yet, no sales exist
        if (!user.mlmUserCode) {
            return Response.json({
                success: true,
                sales: [],
                totalSales: 0,
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalRecords: 0,
                    limit
                }
            });
        }

        // Build filter for sales
        let filter = { userCode: user.mlmUserCode }; // assuming sales have `userCode` field

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate).toISOString();
            if (toDate) filter.createdAt.$lte = new Date(toDate).toISOString();
        }

        const skip = (page - 1) * limit;
        const total = await sales.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const results = await sales
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Calculate total sales amount
        const totalSalesAgg = await sales.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        const totalSales = totalSalesAgg[0]?.total || 0;

        return Response.json({
            success: true,
            sales: results,
            totalSales,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords: total,
                limit
            }
        });

    } catch (err) {
        console.log("❌ Error fetching sales:", err);
        return Response.json({ error: "Internal Server Error", success: false }, { status: 500 });
    }
}