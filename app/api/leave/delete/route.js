import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';
import { format, eachDayOfInterval } from 'date-fns';

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

        // Calculate dates
        const start = new Date(leaveStartDate);
        const end = new Date(leaveEndDate);
        const dates = eachDayOfInterval({ start, end });
        const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));

        // 2️⃣ Remove leave-marked attendance from employee dynamically by month
        const updatedAttendance = { ...employee.attendance };
        for (const d of dates) {
            const monthName = format(d, 'MMMM');
            const dateStr = format(d, 'yyyy-MM-dd');
            if (updatedAttendance[monthName]) {
                 updatedAttendance[monthName] = updatedAttendance[monthName].filter(
                     att => att.date !== dateStr || (att.status === 'present' || att.status === 'Checked In')
                 );
            }
        }

        // Also remove the leave request from the leaveRequests array
        const updatedLeaveRequests = (employee.leaveRequests || []).filter(
            lr => !(lr.startDate === leaveStartDate && lr.endDate === leaveEndDate)
        );

        await employees.updateOne(
            { _id: new ObjectId(employeeId) },
            { $set: { attendance: updatedAttendance, leaveRequests: updatedLeaveRequests, modified_on: new Date() } }
        );

        // 3️⃣ Remove leave from manager
        if (employee.reportingId) {
            const managerId = new ObjectId(employee.reportingId);
            const manager = await employees.findOne({ _id: managerId });
            if (manager) {
                const updatedLeaves = (manager.leaves || []).filter(
                    leave =>
                        !(leave.employeeId === employeeId &&
                            leave.leaveDates.some(date => dateStrings.includes(date)))
                );
                const updatedPendingLeaves = (manager.pendingLeaves || []).filter(
                    leave =>
                        !(leave.employeeId === employeeId &&
                            leave.leaveDates.some(date => dateStrings.includes(date)))
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
