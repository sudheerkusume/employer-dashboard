// Helper function to format date
import { format } from 'date-fns';

export function generatePayslip(employee, targetMonth, targetYear) {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // If no target month/year provided, determine based on current date
    let payslipMonthDate;
    if (targetMonth !== undefined && targetYear !== undefined) {
        payslipMonthDate = new Date(targetYear, targetMonth, 1);
    } else {
        // Default: show previous month's payslip, but only after 5th of current month
        if (currentDay >= 5) {
            payslipMonthDate = new Date(currentYear, currentMonth - 1, 1);
        } else {
            // If before 5th, show payslip from 2 months ago
            payslipMonthDate = new Date(currentYear, currentMonth - 2, 1);
        }
    }

    const monthName = payslipMonthDate.toLocaleString("default", { month: "long" });
    const year = payslipMonthDate.getFullYear();
    const monthIndex = payslipMonthDate.getMonth();

    // Get date of joining
    const dateOfJoining = new Date(employee.dateOfJoining);
    const dojMonth = dateOfJoining.getMonth();
    const dojYear = dateOfJoining.getFullYear();
    const dojDay = dateOfJoining.getDate();

    // Get attendance for the specific month
    const monthAttendance = employee?.attendance?.[monthName] || [];

    // Create a map of dates that have attendance records for faster lookup
    const attendanceDateMap = new Map();
    monthAttendance.forEach(record => {
        const recordDate = new Date(record.date);
        const dayKey = recordDate.getDate();
        attendanceDateMap.set(dayKey, record);
    });

    // ✅ Special handling for joining month
    let startDay = 1;
    let endDay = new Date(year, monthIndex + 1, 0).getDate(); // Last day of month

    if (monthIndex === dojMonth && year === dojYear) {
        // This is the joining month - calculate from joining date to end of month
        startDay = dojDay;
    }

    // ✅ Define holidays for the year
    const holidays = [
        `${year}-01-01`, // New Year
        `${year}-01-26`, // Republic Day
        `${year}-03-25`, // Holi
        `${year}-08-15`, // Independence Day
        `${year}-10-02`, // Gandhi Jayanti
        `${year}-10-18`, // Dussehra
        `${year}-10-20`, // Diwali
        `${year}-12-25`  // Christmas
    ];

    // ✅ Function to calculate working hours from check-in and check-out
    const calculateWorkingHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;

        const [inHour, inMinute] = checkIn.split(':').map(Number);
        const [outHour, outMinute] = checkOut.split(':').map(Number);

        const inTime = inHour * 60 + inMinute;
        const outTime = outHour * 60 + outMinute;

        let diffMinutes = outTime - inTime;

        // Subtract 1 hour lunch break if worked more than 6 hours
        if (diffMinutes > 360) {
            diffMinutes -= 60;
        }

        const hours = diffMinutes / 60;
        return Math.round(hours * 100) / 100;
    };

    // ✅ Function to check if a day is absent
    const isAbsent = (attendanceRecord) => {
        if (!attendanceRecord) return true;

        const status = attendanceRecord.status?.toLowerCase();
        const checkIn = attendanceRecord.checkIn;
        const checkOut = attendanceRecord.checkOut;

        // Check if status is explicitly 'absent'
        if (status === 'absent') return true;

        // Check if there's no check-in and no check-out
        const hasNoCheckInOut = (!checkIn || checkIn === '') && (!checkOut || checkOut === '');

        // Parse working hours if available
        let workingHours = 0;
        if (attendanceRecord.workingHours) {
            const hoursMatch = attendanceRecord.workingHours.match(/[\d.]+/);
            if (hoursMatch) {
                workingHours = parseFloat(hoursMatch[0]);
            }
        }

        // If no check-in/out AND working hours is 0 or '0 hrs', it's absent
        if (hasNoCheckInOut && (workingHours === 0 || attendanceRecord.workingHours === '0 hrs')) {
            return true;
        }

        // If status is empty/undefined and no check-in/out, it's absent
        if ((!status || status === '') && hasNoCheckInOut) {
            return true;
        }

        return false;
    };

    // ✅ Function to calculate actual working hours from attendance record
    const getWorkingHours = (attendanceRecord) => {
        if (!attendanceRecord) return 0;

        const checkIn = attendanceRecord.checkIn;
        const checkOut = attendanceRecord.checkOut;

        // Calculate from check-in/check-out if available
        if (checkIn && checkOut && checkIn !== '' && checkOut !== '') {
            return calculateWorkingHours(checkIn, checkOut);
        }

        // Parse from workingHours string
        if (attendanceRecord.workingHours) {
            const hoursMatch = attendanceRecord.workingHours.match(/[\d.]+/);
            if (hoursMatch) {
                return parseFloat(hoursMatch[0]);
            }
        }

        return 0;
    };

    // ✅ Calculate attendance metrics
    let totalPresentDays = 0; // Total days counted as present (including half days)
    let lossOfPayDays = 0; // Total days with loss of pay (full + half day absents)
    let fullDayAbsents = 0;
    let halfDayAbsents = 0;
    let fullDayPresents = 0;
    let halfDayPresents = 0;
    let autoPresentDays = 0;

    // Loop through ALL calendar days from startDay to endDay
    for (let day = startDay; day <= endDay; day++) {
        const currentDateObj = new Date(year, monthIndex, day);
        const dateStr = format(currentDateObj, 'yyyy-MM-dd');

        const dayOfWeek = currentDateObj.getDay();
        const isSunday = dayOfWeek === 0;
        const isHoliday = holidays.includes(dateStr);

        // Automatically count Sundays, holidays, and tech Saturdays as present (no LOP)
        if (isSunday || isHoliday) {
            totalPresentDays++;
            autoPresentDays++;
            continue;
        }

        // Check if attendance record exists for this date using the map
        const attendanceRecord = attendanceDateMap.get(day);

        // Check if absent using the improved function
        if (isAbsent(attendanceRecord)) {
            // Full day absent
            fullDayAbsents++;
            lossOfPayDays++;
            continue;
        }

        // If not absent, get working hours
        const workingHours = getWorkingHours(attendanceRecord);

        // Check if present with working hours
        if (workingHours >= 6) {
            // Full day present
            fullDayPresents++;
            totalPresentDays++;
        } else if (workingHours >= 4 && workingHours < 6) {
            // Half day present - counts as present but LOP for half day
            halfDayPresents++;
            totalPresentDays += 0.5;
            lossOfPayDays += 0.5; // Half day absent = 0.5 day LOP
            halfDayAbsents += 0.5;
        } else if (workingHours > 0 && workingHours < 4) {
            // Less than 4 hours - treat as half day present with LOP
            halfDayPresents += 0.5;
            totalPresentDays += 0.5;
            lossOfPayDays += 0.5; // Half day absent = 0.5 day LOP
            halfDayAbsents += 0.5;
        } else {
            // If working hours is 0 but not marked as absent, check status
            const status = attendanceRecord?.status?.toLowerCase();
            if (status === 'approved' || status === 'leaveapproved') {
                // Approved leave - counts as present but LOP for full day
                fullDayAbsents++;
                lossOfPayDays++;
            } else {
                // Default to absent if something is wrong
                fullDayAbsents++;
                lossOfPayDays++;
            }
        }
    }

    // All absents count as loss of pay (no paid leaves)
    const finalLossOfPayDays = lossOfPayDays;

    // ✅ Salary calculation based on CTC structure
    const annualCTC = parseInt(String(employee.ctc).replace(/,/g, ""), 10);
    const monthlyGross = annualCTC / 12;

    // Calculate daily rate (based on 30 days per month)
    const dailyRate = monthlyGross / 30;
    const halfDayRate = dailyRate / 2;

    // Calculate salary after Loss of Pay (for both full and half days)
    let lopAmount = 0;
    let fullDayLopAmount = Math.round(dailyRate * Math.floor(finalLossOfPayDays));
    let halfDayLopAmount = Math.round(halfDayRate * (finalLossOfPayDays % 1));
    lopAmount = fullDayLopAmount + halfDayLopAmount;

    const proRatedGross = Math.round(monthlyGross - lopAmount);

    // ✅ Salary breakup based on percentages
    const basicSalary = Math.round(proRatedGross * 0.4); // 40% of Gross
    const hra = Math.round(basicSalary * 0.4); // 40% of Basic (16% of Gross)
    const conveyanceAllowance = 1600; // Fixed as per tax rules
    const medicalAllowance = 0;

    // Special Allowance = Remaining amount after all other components
    const specialAllowance = proRatedGross - (basicSalary + hra + conveyanceAllowance + medicalAllowance);

    const earnings = [
        { name: "Basic Salary", amount: basicSalary },
        { name: "House Rent Allowance (HRA)", amount: hra },
        { name: "Special Allowance", amount: specialAllowance },
        { name: "Conveyance Allowance", amount: conveyanceAllowance },
        { name: "Medical Allowance", amount: medicalAllowance },
    ];

    const grossEarnings = earnings.reduce((a, b) => a + b.amount, 0);

    // ✅ Deductions
    const deductions = [{ name: "Professional Tax (PT)", amount: 200 }];

    if (finalLossOfPayDays > 0) {
        let lopDescription = `Loss of Pay (${finalLossOfPayDays.toFixed(1)} day${finalLossOfPayDays > 1 ? "s" : ""})`;
        deductions.push({
            name: lopDescription,
            amount: lopAmount,
        });
    }

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const netPay = grossEarnings - totalDeductions;

    // ✅ Total working days (calendar days in the period)
    const totalWorkingDays = endDay - startDay + 1;

    // ✅ Salary cycle display
    let salaryCycle;
    if (monthIndex === dojMonth && year === dojYear) {
        salaryCycle = `${monthName} ${dojDay} - ${monthName} ${endDay}`;
    } else {
        salaryCycle = `${monthName} 1 - ${monthName} ${endDay}`;
    }

    // ✅ Return structured payslip with detailed attendance info
    return {
        company: {
            name: "B Max PROJECTS PVT LTD",
            address:
                "1st Floor, Techno Pearl, Plot No.6/3, HUDA Techno Enclave, HITEC City, Hyderabad, Telangana 500081",
        },
        employee: {
            name: employee.name,
            code: employee.employeeCode,
            designation: employee.designation,
            department: employee.department,
            dateOfJoining: new Date(employee.dateOfJoining).toLocaleDateString(),
            account: employee.accountDetails?.accountNumber || "N/A",
            ifsc: employee.accountDetails?.ifscCode || "N/A",
            bank: employee.accountDetails?.branch || "N/A",
        },
        month: monthName,
        year,
        salaryCycle,
        totalWorkingDays,
        totalPresentDays: typeof totalPresentDays === 'number' ? totalPresentDays.toFixed(1) : totalPresentDays,
        paidLeaves: 0,
        lossOfPayDays: finalLossOfPayDays.toFixed(1),
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        netPay,
        // Detailed attendance breakdown (for debugging/info)
        attendanceBreakdown: {
            fullDayPresents: fullDayPresents,
            halfDayPresents: halfDayPresents,
            fullDayAbsents: fullDayAbsents,
            halfDayAbsents: halfDayAbsents,
            autoPresentDays: autoPresentDays,
            totalAbsentDays: lossOfPayDays,
            finalLossOfPayDays: finalLossOfPayDays
        }
    };
}