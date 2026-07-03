import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';

export async function PUT(request) {
    try {
        const body = await request.json();
        const { managerId, employeeId, startDate, endDate, status } = body;

        if (!managerId || !employeeId || !startDate || !endDate || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        // 1. Fetch Manager
        const manager = await employeesCollection.findOne({ _id: new ObjectId(managerId) });
        if (!manager) {
            return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
        }

        // 2. Find the pending leave request
        const pendingRequest = manager.pendingLeaves?.find(
            (req) => req.employeeId === employeeId && req.startDate === startDate && req.endDate === endDate
        );

        if (!pendingRequest) {
            return NextResponse.json({ error: 'Leave request not found in pending queue' }, { status: 404 });
        }

        // 3. Update the employee's attendance records
        // The leave dates are stored in the pending request
        const leaveDates = pendingRequest.leaveDates || [];
        const leaveType = pendingRequest.leaveType || "full";
        
        for (const date of leaveDates) {
            const monthName = new Date(date).toLocaleString("default", { month: "long" });
            
            if (status === "approved") {
                let targetLeaveStatus = "approved";
                if (leaveType === "first half") targetLeaveStatus = "firstHalfApproved";
                if (leaveType === "second half") targetLeaveStatus = "secondHalfApproved";

                const updateObj = { [`attendance.${monthName}.$.leaveStatus`]: targetLeaveStatus };
                if (leaveType !== "first half" && leaveType !== "second half") {
                    updateObj[`attendance.${monthName}.$.status`] = "approved";
                }

                await employeesCollection.updateOne(
                    { _id: new ObjectId(employeeId), [`attendance.${monthName}.date`]: date },
                    { $set: updateObj }
                );
            } else if (status === "rejected") {
                const updateObj = { [`attendance.${monthName}.$.leaveStatus`]: "rejected" };
                if (leaveType !== "first half" && leaveType !== "second half") {
                    updateObj[`attendance.${monthName}.$.status`] = "rejected";
                }

                await employeesCollection.updateOne(
                    { _id: new ObjectId(employeeId), [`attendance.${monthName}.date`]: date },
                    { $set: updateObj }
                );
            }
        }

        // 4. Remove from manager.pendingLeaves
        await employeesCollection.updateOne(
        { _id: new ObjectId(managerId) },
        {
            $pull: {
                pendingLeaves: { _id: pendingRequest._id }
            }
        }
    );

    // 5. Add to manager's approved/rejected history
    const reviewedRecord = {
        ...pendingRequest,
        status,
        reviewedBy: manager.name,
        reviewedOn: new Date().toISOString()
    };

    const fieldName = status === "approved" ? "approvedLeaves" : "rejectedLeaves";

    await employeesCollection.updateOne(
        { _id: new ObjectId(managerId) },
        { $push: { [fieldName]: reviewedRecord } }
    );

    return NextResponse.json({ success: true, message: `Leave ${status} successfully` });

} catch (error) {
    console.error('PUT /api/leave/approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
}