import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const leaveDate = searchParams.get('leaveDate');
        const employeeId = searchParams.get('employeeId'); // send employeeId from frontend if needed

        if (!leaveDate || !employeeId) {
            return NextResponse.json({ error: "employeeId and leaveDate are required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        const employee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

        const currentAttendance = employee.attendance || {};
        let leaveFound = false;

        // Loop through months to find the leave by date
        for (const month of Object.keys(currentAttendance)) {
            const newMonthAttendance = currentAttendance[month].filter(record => {
                if (record.date === leaveDate && record.status && record.status !== 'present') {
                    leaveFound = true;
                    return false; // remove leave
                }
                return true; // keep other records
            });
            currentAttendance[month] = newMonthAttendance;
        }

        if (!leaveFound) {
            return NextResponse.json({ error: "Leave not found for this date" }, { status: 404 });
        }

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId) },
            { $set: { attendance: currentAttendance, modified_on: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: "Failed to withdraw leave" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Leave on ${leaveDate} withdrawn successfully`
        });

    } catch (err) {
        console.error('DELETE /api/leave error:', err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
