export function generatePayslip(employee) {
    const currentDate = new Date();

    // Determine salary month → always previous month
    const payslipMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const monthName = payslipMonthDate.toLocaleString("default", { month: "long" });
    const year = payslipMonthDate.getFullYear();

    // Salary cycle: 25th previous → 25th current
    const previousMonthName = new Date(year, payslipMonthDate.getMonth() - 1)
        .toLocaleString("default", { month: "long" });

    const prevAttendance = employee?.attendance?.[previousMonthName] || [];
    const currAttendance = employee?.attendance?.[monthName] || [];

    // ✅ Collect attendance window from 25th prev → 25th current
    const combinedAttendance = [
        ...prevAttendance.filter((d) => new Date(d.date).getDate() >= 25),
        ...currAttendance.filter((d) => new Date(d.date).getDate() <= 25),
    ];

    // ✅ Calculate actual total working days in that period
    const totalWorkingDays = combinedAttendance.filter(
        (d) => d.status?.toLowerCase() !== "holiday" && d.status?.toLowerCase() !== "sunday"
    ).length || 30; // fallback to 30 if no data

    // ✅ Count actual present & leave days
    const totalPresentDays = combinedAttendance.filter(
        (d) => d.status?.toLowerCase() === "present"
    ).length;

    const totalLeaves = combinedAttendance.filter(
        (d) => d.status?.toLowerCase() === "approved" || d.status?.toLowerCase() === "leave"
    ).length;

    // ✅ Allow one paid leave, rest are LOP
    const paidLeaves = Math.min(totalLeaves, 1);
    const lossOfPayDays = Math.max(totalLeaves - paidLeaves, 0);

    // ✅ Effective payable days
    const effectivePaidDays = totalPresentDays + paidLeaves;

    // ✅ Salary calculation based on present days only
    const annualCTC = parseInt(String(employee.ctc).replace(/,/g, ""), 10);
    const monthlyGross = annualCTC / 12;
    const dailyRate = monthlyGross / 30; // always divide by 30 (standard salary basis)

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
    const deductions = [{ name: "Professional Tax (Telangana)", amount: 200 }];

    if (lossOfPayDays > 0) {
        deductions.push({
            name: `Loss of Pay (${lossOfPayDays} day${lossOfPayDays > 1 ? "s" : ""})`,
            amount: lopAmount,
        });
    }

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const netPay = grossEarnings - totalDeductions;

    // ✅ Return structured payslip
    return {
        company: {
            name: "Real Beez Estates Pvt Ltd",
            address:
                "2nd Floor, YS RAO Towers, Madhapur Rd, Sri Rama Colony, Jubilee Hills, Hyderabad, Telangana 500033",
        },
        employee: {
            name: employee.name,
            code: employee.employeeCode,
            designation: employee.designation,
            department: employee.deportment,
            dateOfJoining: new Date(employee.dateOfJoining).toLocaleDateString(),
            account: employee.accountDetails.accountNumber,
            ifsc: employee.accountDetails.ifscCode,
            bank: employee.accountDetails.branch,
        },
        month: monthName,
        year,
        salaryCycle: `${previousMonthName} 25 - ${monthName} 25`,
        totalWorkingDays,
        totalPresentDays,
        paidLeaves,
        lossOfPayDays,
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        netPay,
    };
}
