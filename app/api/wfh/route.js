import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';

export async function POST(request) {
    try {
        const body = await request.json();
        const { employeeId, startDate, endDate, reason } = body;

        if (!employeeId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        const employee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 });
        }

        const allDates = eachDayOfInterval({ start, end });
        const businessDates = allDates.filter(date => !isWeekend(date));

        if (businessDates.length === 0) {
            return NextResponse.json({ error: 'No valid business days in selected range' }, { status: 400 });
        }

        const wfhRequestObj = {
            id: new ObjectId().toString(),
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
            reason: reason || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId) },
            {
                $push: { wfhRequests: wfhRequestObj }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'Failed to apply WFH' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `WFH applied successfully for ${businessDates.length} day(s)`,
            wfhDates: businessDates.map(date => format(date, 'yyyy-MM-dd'))
        }, { status: 201 });

    } catch (error) {
        console.log('POST /api/wfh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
