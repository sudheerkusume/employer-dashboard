import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';

export async function PUT(request) {
    try {
        const body = await request.json();
        const { managerId, employeeId, startDate, endDate, status } = body;

        if (!employeeId || !startDate || !endDate || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        // Update the specific leave request status
        const result = await employeesCollection.updateOne(
            {
                _id: new ObjectId(employeeId),
                "leaveRequests.startDate": startDate,
                "leaveRequests.endDate": endDate
            },
            {
                $set: {
                    "leaveRequests.$.status": status,
                    "leaveRequests.$.approvedBy": managerId,
                    "leaveRequests.$.updatedAt": new Date().toISOString()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Leave ${status} successfully` });

    } catch (error) {
        console.error('PUT /api/leave/approve error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}