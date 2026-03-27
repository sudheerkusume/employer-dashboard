// app/api/mlm/sales/route.js

import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const userCode = url.searchParams.get("userCode");
        const userId = url.searchParams.get("userId");
        const fromDate = url.searchParams.get("fromDate");
        const toDate = url.searchParams.get("toDate");
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 50;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const sales = db.collection("mlm_sales");

        let filter = {};

        if (userCode) {
            filter.userCode = userCode;
        } else if (userId) {
            filter.userId = new ObjectId(userId);
        }

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

        // Calculate total sales
        const totalSales = await sales.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();

        return Response.json({
            success: true,
            sales: results,
            totalSales: totalSales[0]?.total || 0,
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