import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const holidays = await db.collection("holidays").find({}).sort({ date: 1 }).toArray();

        return Response.json(holidays);
    } catch (err) {
        console.log("❌ Error fetching holidays:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, date, type } = body;

        if (!name || !date) {
            return Response.json({ error: "Name and Date are required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        const newHoliday = {
            name,
            date: new Date(date),
            type: type || "Mandatory",
            createdAt: new Date()
        };

        const result = await db.collection("holidays").insertOne(newHoliday);

        return Response.json({
            success: true,
            message: "Holiday added successfully",
            holiday: { _id: result.insertedId, ...newHoliday }
        });
    } catch (err) {
        console.log("❌ Error adding holiday:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json({ error: "Holiday ID is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        await db.collection("holidays").deleteOne({ _id: new ObjectId(id) });

        return Response.json({ success: true, message: "Holiday deleted successfully" });
    } catch (err) {
        console.log("❌ Error deleting holiday:", err);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
