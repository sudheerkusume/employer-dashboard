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

    // ✅ Special handling for joining month
    let startDay = 1;
    let endDay = new Date(year, monthIndex + 1, 0).getDate(); // Last day of month

    if (monthIndex === dojMonth && year === dojYear) {
        // This is the joining month - calculate from joining date to end of month
        startDay = dojDay;
    }

    // Filter attendance for the relevant period
    const relevantAttendance = monthAttendance.filter(record => {
        const recordDate = new Date(record.date);
        const recordDay = recordDate.getDate();
        return recordDay >= startDay && recordDay <= endDay;
    });

    // ✅ Total working days includes ALL calendar days in the period
    const totalWorkingDays = endDay - startDay + 1;

    // ✅ Define holidays for the year
    const holidays = [
        `${year}-01-01`, `${year}-01-26`, `${year}-03-25`, `${year}-08-15`,
        `${year}-10-02`, `${year}-10-18`, `${year}-10-20`, `${year}-12-25`
    ];

    // ✅ Calculate Total Present Days (includes actual present + Sundays + holidays + tech Tuesdays)
    let totalPresentDays = 0;
    let actualPresentDays = 0;
    let actualLeaves = 0;

    for (let day = startDay; day <= endDay; day++) {
        const currentDate = new Date(year, monthIndex, day);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        const isSunday = currentDate.getDay() === 0;
        const isHoliday = holidays.includes(dateStr);
        const isTuesday = currentDate.getDay() === 2;
        const isTechOffDay = employee?.department === "tech" && isTuesday;

        // ✅ Automatically count Sundays, holidays, and tech Tuesdays as present
        if (isSunday || isHoliday || isTechOffDay) {
            totalPresentDays++;
        }

        // Find attendance record for this date
        const attendanceRecord = relevantAttendance.find(record => {
            const recordDate = new Date(record.date);
            return recordDate.getDate() === day;
        });

        if (attendanceRecord) {
            const status = attendanceRecord.status?.toLowerCase();
            const workingHours = parseFloat(attendanceRecord.workingHours) || 0;

            // Calculate actual present days and leaves for working days
            if (!isSunday && !isHoliday && !isTechOffDay) {
                if (status === 'present' || status === 'presentlate') {
                    actualPresentDays++;
                    totalPresentDays++;
                }
                else if (status === 'approved' || status === 'leaveapproved') {
                    actualLeaves++;
                    totalPresentDays++; // Leaves also count as present days
                }
                else if (!status && workingHours >= 8.45) {
                    // No status but worked full day
                    actualPresentDays++;
                    totalPresentDays++;
                }
                else if (!status && workingHours >= 4) {
                    // No status but worked half day
                    actualPresentDays += 0.5;
                    actualLeaves += 0.5;
                    totalPresentDays++; // Half day still counts as 1 present day
                }
                else if (status === 'firsthalfp' || status === 'secondhalfp') {
                    // Half day present
                    actualPresentDays += 0.5;
                    actualLeaves += 0.5;
                    totalPresentDays++; // Half day still counts as 1 present day
                }
                else if (status === 'firsthalfapproved' || status === 'secondhalfapproved') {
                    // Half day leave
                    actualPresentDays += 0.5;
                    actualLeaves += 0.5;
                    totalPresentDays++; // Half day leave still counts as 1 present day
                }
                else if (status === 'absent') {
                    // Absent - don't add to totalPresentDays (already not included)
                }
            }
        } else {
            // No attendance record found for working day = absent
            // Don't add to totalPresentDays (already not included for working days)
        }
    }

    // ✅ Handle leaves - allow one paid leave, rest are LOP
    const paidLeaves = Math.min(actualLeaves, 1);
    const lossOfPayDays = Math.max(actualLeaves - paidLeaves, 0);

    // ✅ Effective payable days (for salary calculation)
    const effectivePaidDays = totalPresentDays; // Use totalPresentDays for salary calculation

    // ✅ Salary calculation
    const annualCTC = parseInt(String(employee.ctc).replace(/,/g, ""), 10);
    const monthlyGross = annualCTC / 12;
    const dailyRate = monthlyGross / 30;

    const proRatedGross = Math.round(dailyRate * effectivePaidDays);
    const lopAmount = Math.round(dailyRate * lossOfPayDays);

    // ✅ Salary breakup
    const earnings = [
        { name: "Basic Salary", amount: Math.round(proRatedGross * 0.4) },
        { name: "House Rent Allowance (HRA)", amount: Math.round(proRatedGross * 0.2) },
        { name: "Special Allowance", amount: Math.round(proRatedGross * 0.368) },
        { name: "Conveyance Allowance", amount: Math.round(proRatedGross * 0.032) },
        { name: "Medical Allowance", amount: 0 },
    ];

    const grossEarnings = earnings.reduce((a, b) => a + b.amount, 0);

    // ✅ Deductions
    const deductions = [{ name: "Professional Tax (PT)", amount: 200 }];

    if (lossOfPayDays > 0) {
        deductions.push({
            name: `Loss of Pay (${lossOfPayDays} day${lossOfPayDays > 1 ? "s" : ""})`,
            amount: lopAmount,
        });
    }

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const netPay = grossEarnings - totalDeductions;

    // ✅ Salary cycle display
    let salaryCycle;
    if (monthIndex === dojMonth && year === dojYear) {
        // Joining month: 5th to end of month
        salaryCycle = `${monthName} ${dojDay} - ${monthName} ${endDay}`;
    } else {
        // Normal month: 1st to end of month
        salaryCycle = `${monthName} 1 - ${monthName} ${endDay}`;
    }

    // ✅ Return structured payslip
    return {
        company: {
            name: "REAL BEEZ ESTATES PVT LTD",
            address:
                "2nd Floor, YS RAO Towers, Madhapur Rd, Sri Rama Colony, Jubilee Hills, Hyderabad, Telangana 500033",
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
        totalWorkingDays, // All calendar days
        totalPresentDays, // Includes Sundays, holidays, tech Tuesdays + actual present
        paidLeaves,
        lossOfPayDays,
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        netPay,
        // Additional info for debugging
        startDay,
        endDay,
        isJoiningMonth: (monthIndex === dojMonth && year === dojYear),
        actualLeaves,
        actualPresentDays
    };
}