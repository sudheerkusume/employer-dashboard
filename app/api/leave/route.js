import { NextResponse } from 'next/server';
import Joi from 'joi';
import clientPromise from '@/app/components/lib/db';
import { ObjectId } from 'mongodb';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';

// Custom date validation
const leaveSchema = Joi.object({
    employeeId: Joi.string().trim().length(24).required(),
    startDate: Joi.alternatives().try(
        Joi.string().isoDate(),
        Joi.date()
    ).required(),
    endDate: Joi.alternatives().try(
        Joi.string().isoDate(),
        Joi.date()
    ).required(),
    reason: Joi.string().max(500).optional().allow(''),
    leaveType: Joi.string().valid('sick', 'casual', 'earned', 'emergency', 'other').default('casual')
});

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Raw leave request payload:', body);

        const { error, value } = leaveSchema.validate(body, { abortEarly: false });

        if (error) {
            return NextResponse.json(
                { error: error.details.map(d => d.message).join(', ') },
                { status: 400 }
            );
        }

        const { employeeId, startDate, endDate, reason, leaveType } = value;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        const employeesCollection = db.collection('employees');

        // Check employee exists
        const employee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Robust date parsing
        const parseDate = (dateInput) => {
            if (dateInput instanceof Date) {
                return dateInput;
            }
            if (typeof dateInput === 'string') {
                // Handle ISO string
                if (dateInput.includes('T')) {
                    return new Date(dateInput);
                }
                // Handle YYYY-MM-DD format
                return new Date(dateInput + 'T00:00:00');
            }
            throw new Error('Invalid date format');
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD format.' },
                { status: 400 }
            );
        }

        // Ensure end date is not before start date
        if (end < start) {
            return NextResponse.json(
                { error: 'End date cannot be before start date' },
                { status: 400 }
            );
        }

        console.log('Parsed dates - Start:', start, 'End:', end);

        const allDates = eachDayOfInterval({ start, end });
        const businessDates = allDates.filter(date => !isWeekend(date));

        console.log('Business dates:', businessDates.map(d => format(d, 'yyyy-MM-dd')));

        if (businessDates.length === 0) {
            return NextResponse.json(
                { error: 'No valid business days in selected range' },
                { status: 400 }
            );
        }

        // Get current attendance or initialize empty object
        const currentAttendance = employee.attendance || {};

        // Add leave records for each date
        businessDates.forEach(date => {
            const month = format(date, 'MMMM');
            const dateStr = format(date, 'yyyy-MM-dd');

            const leaveRecord = {
                date: dateStr,
                status: 'leave',
                leaveType,
                reason: reason || '',
                markedOn: new Date()
            };

            // Initialize month array if it doesn't exist
            if (!currentAttendance[month]) {
                currentAttendance[month] = [];
            }

            // Check if date already exists
            const existingIndex = currentAttendance[month].findIndex(record => record.date === dateStr);

            if (existingIndex === -1) {
                // Add new leave record
                currentAttendance[month].push(leaveRecord);
            } else {
                // Update existing record
                currentAttendance[month][existingIndex] = leaveRecord;
            }
        });

        // Update the employee document
        const result = await employeesCollection.updateOne(
            { _id: new ObjectId(employeeId) },
            {
                $set: {
                    attendance: currentAttendance,
                    modified_on: new Date()
                }
            }
        );

        console.log('Update result:', result);

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'No changes made to attendance' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Leave applied successfully for ${businessDates.length} day(s)`,
            leaveDates: businessDates.map(date => format(date, 'yyyy-MM-dd')),
            updatedMonths: Object.keys(currentAttendance).filter(month =>
                currentAttendance[month].some(record =>
                    businessDates.some(bd => format(bd, 'yyyy-MM-dd') === record.date)
                )
            )
        }, { status: 201 });

    } catch (error) {
        console.error('POST /api/leave error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}