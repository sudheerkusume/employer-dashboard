import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const leaveStartDate = searchParams.get('startDate');
        const leaveEndDate = searchParams.get('endDate');

        if (!employeeId || !leaveStartDate || !leaveEndDate) {
            return NextResponse.json(
                { error: 'employeeId, startDate, and endDate are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employees = db.collection('employees');

        // 1️⃣ Fetch employee
        const employee = await employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        // 2️⃣ Get leave dates to remove
        const leaveDates = employee.attendance && employee.attendance.October
            ? employee.attendance.October.filter(att => att.date >= leaveStartDate && att.date <= leaveEndDate)
                .map(att => att.date)
            : [];

        if (leaveDates.length === 0) {
            return NextResponse.json({ error: 'No matching attendance records found' }, { status: 404 });
        }

        // 3️⃣ Remove leave-marked attendance from employee
        const updatedAttendance = { ...employee.attendance };
        if (updatedAttendance.October) {
            updatedAttendance.October = updatedAttendance.October.filter(
                att => !leaveDates.includes(att.date) || att.status === 'present' || att.status === 'Checked In'
            );
        }

        await employees.updateOne(
            { _id: new ObjectId(employeeId) },
            { $set: { attendance: updatedAttendance, modified_on: new Date() } }
        );

        // 4️⃣ Remove leave from manager
        if (employee.reportingId) {
            const managerId = new ObjectId(employee.reportingId);
            const manager = await employees.findOne({ _id: managerId });
            if (manager) {
                const updatedLeaves = manager.leaves.filter(
                    leave =>
                        !(leave.employeeId === employeeId &&
                            leave.leaveDates.some(date => leaveDates.includes(date)))
                );
                const updatedPendingLeaves = manager.pendingLeaves.filter(
                    leave =>
                        !(leave.employeeId === employeeId &&
                            leave.leaveDates.some(date => leaveDates.includes(date)))
                );

                await employees.updateOne(
                    { _id: managerId },
                    { $set: { leaves: updatedLeaves, pendingLeaves: updatedPendingLeaves, modified_on: new Date() } }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: `Leave withdrawn successfully for ${leaveStartDate} to ${leaveEndDate}`,
        });
    } catch (err) {
        console.log('❌ DELETE leave error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
