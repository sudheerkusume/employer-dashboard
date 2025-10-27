// import { NextResponse } from 'next/server';
// import Joi from 'joi';
// import clientPromise from '@/app/components/lib/db';
// import { ObjectId } from 'mongodb';
// import { format, eachDayOfInterval, isWeekend } from 'date-fns';

// // Custom date validation
// const leaveSchema = Joi.object({
//     employeeId: Joi.string().trim().length(24).required(),
//     startDate: Joi.alternatives().try(
//         Joi.string().isoDate(),
//         Joi.date()
//     ).required(),
//     endDate: Joi.alternatives().try(
//         Joi.string().isoDate(),
//         Joi.date()
//     ).required(),
//     reason: Joi.string().max(500).optional().allow(''),
//     leaveType: Joi.string().valid('sick', 'casual', 'earned', 'emergency', 'other').default('casual')
// });

// export async function POST(request) {
//     try {
//         const body = await request.json();
//         console.log('Raw leave request payload:', body);

//         const { error, value } = leaveSchema.validate(body, { abortEarly: false });

//         if (error) {
//             return NextResponse.json(
//                 { error: error.details.map(d => d.message).join(', ') },
//                 { status: 400 }
//             );
//         }

//         const { employeeId, startDate, endDate, reason, leaveType } = value;
//         const client = await clientPromise;
//         const db = client.db(process.env.MONGODB_DBNAME);
//         const employeesCollection = db.collection('employees');

//         // Check employee exists
//         const employee = await employeesCollection.findOne({ _id: new ObjectId(employeeId) });
//         if (!employee) {
//             return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
//         }

//         // Robust date parsing
//         const parseDate = (dateInput) => {
//             if (dateInput instanceof Date) {
//                 return dateInput;
//             }
//             if (typeof dateInput === 'string') {
//                 // Handle ISO string
//                 if (dateInput.includes('T')) {
//                     return new Date(dateInput);
//                 }
//                 // Handle YYYY-MM-DD format
//                 return new Date(dateInput + 'T00:00:00');
//             }
//             throw new Error('Invalid date format');
//         };

//         const start = parseDate(startDate);
//         const end = parseDate(endDate);

//         // Validate dates
//         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//             return NextResponse.json(
//                 { error: 'Invalid date format. Use YYYY-MM-DD format.' },
//                 { status: 400 }
//             );
//         }

//         // Ensure end date is not before start date
//         if (end < start) {
//             return NextResponse.json(
//                 { error: 'End date cannot be before start date' },
//                 { status: 400 }
//             );
//         }

//         console.log('Parsed dates - Start:', start, 'End:', end);

//         const allDates = eachDayOfInterval({ start, end });
//         const businessDates = allDates.filter(date => !isWeekend(date));

//         console.log('Business dates:', businessDates.map(d => format(d, 'yyyy-MM-dd')));

//         if (businessDates.length === 0) {
//             return NextResponse.json(
//                 { error: 'No valid business days in selected range' },
//                 { status: 400 }
//             );
//         }

//         // Get current attendance or initialize empty object
//         const currentAttendance = employee.attendance || {};

//         // Add leave records for each date
//         businessDates.forEach(date => {
//             const month = format(date, 'MMMM');
//             const dateStr = format(date, 'yyyy-MM-dd');

//             const leaveRecord = {
//                 date: dateStr,
//                 status: 'leave',
//                 leaveType,
//                 reason: reason || '',
//                 markedOn: new Date()
//             };

//             // Initialize month array if it doesn't exist
//             if (!currentAttendance[month]) {
//                 currentAttendance[month] = [];
//             }

//             // Check if date already exists
//             const existingIndex = currentAttendance[month].findIndex(record => record.date === dateStr);

//             if (existingIndex === -1) {
//                 // Add new leave record
//                 currentAttendance[month].push(leaveRecord);
//             } else {
//                 // Update existing record
//                 currentAttendance[month][existingIndex] = leaveRecord;
//             }
//         });

//         // Update the employee document
//         const result = await employeesCollection.updateOne(
//             { _id: new ObjectId(employeeId) },
//             {
//                 $set: {
//                     attendance: currentAttendance,
//                     modified_on: new Date()
//                 }
//             }
//         );

//         console.log('Update result:', result);

//         if (result.modifiedCount === 0) {
//             return NextResponse.json(
//                 { error: 'No changes made to attendance' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             success: true,
//             message: `Leave applied successfully for ${businessDates.length} day(s)`,
//             leaveDates: businessDates.map(date => format(date, 'yyyy-MM-dd')),
//             updatedMonths: Object.keys(currentAttendance).filter(month =>
//                 currentAttendance[month].some(record =>
//                     businessDates.some(bd => format(bd, 'yyyy-MM-dd') === record.date)
//                 )
//             )
//         }, { status: 201 });

//     } catch (error) {
//         console.error('POST /api/leave error:', error);
//         return NextResponse.json(
//             {
//                 error: 'Internal server error',
//                 details: process.env.NODE_ENV === 'development' ? error.message : undefined
//             },
//             { status: 500 }
//         );
//     }
// }


'use client';
import React, { useState, useMemo, Fragment, useContext } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    getMonth, setMonth, getYear, setYear, isSunday
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Mutated } from '../config/useswrfetch';
import Loading from '../common/loading';
import RootContext from '../config/rootcontext';
import ComboBox from '../common/form/combobox';

// 🎨 Define color palette
const colors = {
    present: "#A8DCAB",
    absent: "#ff6a6a",
    leave: "#e8d15dff",
    today: "#48a84dff",
    holiday: "#d5d7d9ff",
    sunday: "#d5d7d9ff",
};

// Helper: Check if current time is before 9 AM
const isBefore9AM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < 9;
};

// Helper: Check if date is holiday (you can customize this with your holiday list)
const isHoliday = (date) => {
    const holidayList = [
        '2025-01-01',
        '2025-01-26',
        '2025-03-25',
        '2025-08-15',
        '2025-10-02',
        '2025-10-18',
        '2025-10-20',
        '2025-10-02',
        '2025-12-25',
    ];
    return holidayList.includes(format(date, 'yyyy-MM-dd'));
};

// Helper: Calculate working hours in decimal
const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const start = inH * 60 + inM;
    const end = outH * 60 + outM;
    const diffMinutes = Math.max(0, end - start);
    return diffMinutes / 60; // hours as decimal
};

// ✅ Helper: Determine attendance status
const determineStatus = (checkIn, checkOut, leaveType, leaveStatus) => {
    const fullDayHrs = 8.75; // 8h 45m
    const halfDayHrs = 4.25; // 4h 15m

    if (!checkIn && !checkOut && !leaveType) return "absent";

    const toDecimal = (time) => {
        if (!time) return null;
        const [h, m] = time.split(":").map(Number);
        return h + m / 60;
    };

    const calculateHours = (inTime, outTime) => {
        if (!inTime || !outTime) return 0;
        const [inH, inM] = inTime.split(":").map(Number);
        const [outH, outM] = outTime.split(":").map(Number);
        const minutes = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
        return minutes / 60;
    };

    const workingHours = calculateHours(checkIn, checkOut);
    const checkInDec = toDecimal(checkIn);

    // ✅ Full Day Leave
    if (leaveType === "full" && leaveStatus === "approved") return "leave-full";

    // ✅ Half Day Leave
    if (leaveType === "firstHalf" && leaveStatus === "approved") {
        if (workingHours >= halfDayHrs) return "half-leave-second-present"; // first half leave, second present
        return "half-leave-first"; // full leave first half
    }

    if (leaveType === "secondHalf" && leaveStatus === "approved") {
        if (workingHours >= halfDayHrs) return "half-leave-first-present"; // second half leave, first present
        return "half-leave-second"; // full leave second half
    }

    // ✅ Regular check-in / check-out logic
    if (!checkIn || !checkOut) return "absent";

    if (workingHours >= fullDayHrs) return "present";

    // ⏰ Half-day present logic
    if (checkInDec < 13.5) {
        // check-in before 1:30 PM
        if (workingHours >= halfDayHrs) return "half-first-present"; // worked morning half
    } else {
        if (workingHours >= halfDayHrs) return "half-second-present"; // worked evening half
    }

    return "absent";
};

// ✅ Split Circle (SVG visual indicator)
const SplitCircle = ({ status, isToday, size = 40 }) => {
    const radius = size / 2;
    const center = radius;


    // 🧠 Define color + divider type (vertical / diagonal)
    const getConfig = () => {
        switch (status) {
            // Full states
            case "present":
                return { left: colors.present, right: colors.present, divider: "none" };
            case "absent":
                return { left: colors.absent, right: colors.absent, divider: "none" };
            case "leave-full":
                return { left: colors.leave, right: colors.leave, divider: "none" };

            // Half-day present (vertical divider)
            case "half-first-present":
                return { left: colors.present, right: colors.absent, divider: "vertical" };
            case "half-second-present":
                return { left: colors.absent, right: colors.present, divider: "vertical" };

            // Half-day leave (diagonal divider)
            case "half-leave-first-present":
                return { left: colors.leave, right: colors.present, divider: "diagonal" };
            case "half-leave-second-present":
                return { left: colors.present, right: colors.leave, divider: "diagonal" };
            default:
                return { left: "transparent", right: "transparent", divider: "none" };

        }
    };

    const { left, right, divider } = getConfig();

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Outline for today */}
            {isToday && (
                <circle
                    cx={center}
                    cy={center}
                    r={radius - 1}
                    stroke={colors.today}
                    strokeWidth="2"
                    fill="none"
                />
            )}

            {/* Base circle */}
            <circle cx={center} cy={center} r={radius} fill={right} />

            {/* Left overlay (half circle or diagonal mask) */}
            {divider === "vertical" && (
                <path
                    d={`M ${center} ${center} L ${center} 0 A ${radius} ${radius} 0 0 0 ${center} ${size} Z`}
                    fill={left}
                />
            )}

            {divider === "diagonal" && (
                <path
                    d={`M 0 ${size} L ${size} 0 L ${size} ${size} Z`}
                    fill={left}
                />
            )}
        </svg>
    );
};
