import clientPromise from "@/app/components/lib/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const client = await clientPromise;
        const db = client.db("realbeez");
        const body = await req.json();
        const { employeeId, employeeName, department, managerId, action, content, date } = body;
        
        // Use IST date format to match frontend
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

        if (action === 'morning_plan') {
            await db.collection("eod").updateOne(
                { employeeId: new ObjectId(employeeId), date: today },
                {
                    $set: {
                        morningPlan: content,
                        planSubmittedAt: new Date(),
                        employeeName,
                        department,
                        managerId: managerId ? new ObjectId(managerId) : null
                    },
                    $setOnInsert: {
                        eveningUpdate: "",
                        blockers: "",
                        status: "pending"
                    }
                },
                { upsert: true }
            );
            return NextResponse.json({ message: "Morning plan saved successfully", success: true }, { status: 201 });
        }
        else if (action === 'evening_update') {
            const result = await db.collection("eod").updateOne(
                {
                    employeeId: new ObjectId(employeeId), date: today
                },
                {
                    $set: {
                        eveningUpdate: content.update,
                        blockers: content.blockers,
                        status: "Submitted",
                        eodSubmittedAt: new Date(),
                        employeeName: employeeName,
                        department: department
                    },
                    $setOnInsert: {
                        // employeeName,
                        // department,
                        managerId: managerId ? new ObjectId(managerId) : null,
                        morningPlan: "No morning plan submitted",
                        planSubmittedAt: null
                    }
                },
                { upsert: true }
            );
            return NextResponse.json({ message: "EOD report submitted successfully", success: true }, { status: 200 });
        }
        return NextResponse.json({ message: "Invalid action", success: false }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const client = await clientPromise;
        const db = client.db("realbeez");
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");
        const id = searchParams.get("id");
        const department = searchParams.get("department");

        let query = {};

        if (role === 'employee') {
            query = { employeeId: new ObjectId(id) };
        } else if (role === 'manager') {
            query = { department: department };
        } else if (role === 'admin') {
            query = {};
        }

        const reports = await db.collection("eod").find(query).sort({
            date: -1
        }).toArray();

        return NextResponse.json({ reports, success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const client = await clientPromise;
        const db = client.db("realbeez");
        const body = await req.json();
        const { employeeId, action, content, reportId } = body;
        
        if (action === 'manager_edit' && reportId) {
             await db.collection("eod").updateOne(
                { _id: new ObjectId(reportId) },
                { $set: { morningPlan: content.morningPlan, eveningUpdate: content.eveningUpdate, blockers: content.blockers } }
            );
            return NextResponse.json({ message: "Report updated", success: true }, { status: 200 });
        }
        
        // Match today's date format (YYYY-MM-DD)
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

        if (action === 'update_morning_plan') {
            await db.collection("eod").updateOne(
                { employeeId: new ObjectId(employeeId), date: today },
                { $set: { morningPlan: content } }
            );
            return NextResponse.json({ message: "Tasks updated", success: true }, { status: 200 });
        }
        
        return NextResponse.json({ message: "Invalid action", success: false }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const client = await clientPromise;
        const db = client.db("realbeez");
        const body = await req.json();
        const { employeeId, reportId } = body;
        
        if (reportId) {
            await db.collection("eod").deleteOne({ _id: new ObjectId(reportId) });
        } else {
            const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
            await db.collection("eod").deleteOne({ employeeId: new ObjectId(employeeId), date: today });
        }
        
        return NextResponse.json({ message: "EOD record deleted", success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}