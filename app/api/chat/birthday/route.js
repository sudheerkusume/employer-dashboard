import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const birthdayEmployeeId = searchParams.get("employeeId");
        const year = searchParams.get("year");

        if (!birthdayEmployeeId || !year) {
            return Response.json({ error: "Missing required parameters: employeeId and year" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const chatCollection = db.collection("birthday_chats");

        const messages = await chatCollection.find({
            birthdayEmployeeId: birthdayEmployeeId,
            year: parseInt(year)
        }).sort({ timestamp: 1 }).toArray();

        return Response.json(messages);
    } catch (error) {
        console.error("GET /api/chat/birthday error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { birthdayEmployeeId, year, senderId, senderName, message } = body;

        if (!birthdayEmployeeId || !year || !senderId || !senderName || !message) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const chatCollection = db.collection("birthday_chats");

        const newMessage = {
            birthdayEmployeeId,
            year: parseInt(year),
            senderId,
            senderName,
            message: message.trim(),
            timestamp: new Date()
        };

        const result = await chatCollection.insertOne(newMessage);

        return Response.json({ 
            success: true, 
            message: "Message sent successfully",
            data: { ...newMessage, _id: result.insertedId }
        }, { status: 201 });

    } catch (error) {
        console.error("POST /api/chat/birthday error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
