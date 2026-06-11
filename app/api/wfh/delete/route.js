import { NextResponse } from 'next/server';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const requestId = searchParams.get('requestId');

        if (!employeeId || !requestId) {
            return NextResponse.json({ error: 'Missing employeeId or requestId' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId) },
            {
                $pull: { wfhRequests: { id: requestId, status: 'pending' } }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'WFH request not found or cannot be withdrawn (already processed)' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'WFH request withdrawn successfully' });

    } catch (error) {
        console.error('DELETE /api/wfh/delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
