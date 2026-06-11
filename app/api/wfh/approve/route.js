import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';
import { eachDayOfInterval, format, isWeekend } from 'date-fns';

export async function PUT(request) {
    try {
        const body = await request.json();
        const { managerId, employeeId, requestId, status } = body;

        if (!managerId || !employeeId || !requestId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        if (!ObjectId.isValid(employeeId)) {
            return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
        }

        // 1. Fetch Manager if managerId is valid
        let reviewerName = "Admin";
        if (managerId && ObjectId.isValid(managerId)) {
            const manager = await employeesCollection.findOne({ _id: new ObjectId(managerId) });
            if (manager && manager.name) {
                reviewerName = manager.name;
            }
        }

        // 2. Fetch Employee and their wfhRequests
        const employee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const wfhRequestIndex = (employee.wfhRequests || []).findIndex(req => req.id === requestId);
        
        if (wfhRequestIndex === -1) {
            return NextResponse.json({ error: 'WFH request not found' }, { status: 404 });
        }

        const pendingRequest = employee.wfhRequests[wfhRequestIndex];

        // 3. If Approved, auto-inject attendance
        if (status === "approved") {
            const start = new Date(pendingRequest.startDate);
            const end = new Date(pendingRequest.endDate);
            const allDates = eachDayOfInterval({ start, end });
            const businessDates = allDates.filter(date => !isWeekend(date));

            const currentAttendance = employee.attendance || {};

            businessDates.forEach(date => {
                const monthName = format(date, 'MMMM');
                const dateStr = format(date, 'yyyy-MM-dd');

                const attendanceRecord = {
                    date: dateStr,
                    checkIn: "09:30",
                    checkOut: "18:30",
                    workingHours: "9.0 hrs",
                    status: "Present (WFH)",
                    lossOfPay: 0,
                };

                if (!currentAttendance[monthName]) {
                    currentAttendance[monthName] = [];
                }

                const existingIndex = currentAttendance[monthName].findIndex(record => record.date === dateStr);

                if (existingIndex === -1) {
                    currentAttendance[monthName].push(attendanceRecord);
                } else {
                    currentAttendance[monthName][existingIndex] = attendanceRecord;
                }
            });

            // Update attendance
            await employeesCollection.updateOne(
                { _id: new ObjectId(employeeId) },
                { $set: { attendance: currentAttendance } }
            );
        }

        // 4. Update the WFH request status inside the employee document
        await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId), "wfhRequests.id": requestId },
            { $set: { "wfhRequests.$.status": status, "wfhRequests.$.reviewedBy": reviewerName, "wfhRequests.$.reviewedOn": new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, message: `WFH ${status} successfully` });

    } catch (error) {
        console.error('PUT /api/wfh/approve error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
