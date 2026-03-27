import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOGO_PATH = "/realbeez.png";
const WATERMARK_PATH = "/icons/watermark.png";

export async function generatePDF(payslip) {
    if (!payslip || !payslip.employee) {
        console.log("❌ Missing payslip data!", payslip);
        return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const watermark = await loadImage(WATERMARK_PATH);
    const logo = await loadImage(LOGO_PATH);

    // Watermark
    const wmRatio = watermark.width / watermark.height;
    let wmWidth = pageWidth * 0.7;
    let wmHeight = wmWidth / wmRatio;
    if (wmHeight > pageHeight * 0.7) {
        wmHeight = pageHeight * 0.7;
        wmWidth = wmHeight * wmRatio;
    }
    const wmX = (pageWidth - wmWidth) / 2;
    const wmY = (pageHeight - wmHeight) / 2;

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.addImage(watermark, "PNG", wmX, wmY, wmWidth, wmHeight);
    doc.restoreGraphicsState();

    // Logo
    const logoRatio = logo.width / logo.height;
    const logoWidth = 120;
    const logoHeight = logoWidth / logoRatio;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, 35, logoWidth, logoHeight);

    // Company Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(payslip.company.name, pageWidth / 2, 90, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(payslip.company.address,
        pageWidth / 2,
        105,
        { align: "center" }
    );

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Salary Slip: ${payslip.month} ${payslip.year}`, pageWidth / 2, 135, { align: "center" });

    // Helper function to format numbers (remove .0 if it's a whole number)
    const formatNumber = (value) => {
        if (!value && value !== 0) return "0";
        const num = parseFloat(value);
        if (isNaN(num)) return value.toString();
        // Check if it's a whole number (no decimal or .0)
        if (num % 1 === 0) {
            return num.toString();
        }
        // Otherwise keep 1 decimal place
        return num.toFixed(1);
    };

    // Helpers
    const departmentTitleCase =
        payslip.employee.department?.charAt(0).toUpperCase() +
        payslip.employee.department?.slice(1).toLowerCase();
    const joiningDate = formatDate(payslip.employee.dateOfJoining);
    const cleanText = (txt) => String(txt || "").replace(/[¹()]/g, "").trim();

    // Employee Info with formatted numbers
    const employeeData = [
        ["Employee Name", cleanText(payslip.employee.name), "Bank A/C", cleanText(payslip.employee.account)],
        ["Employee Code", cleanText(payslip.employee.code), "IFSC", cleanText(payslip.employee.ifsc)],
        ["Designation", cleanText(payslip.employee.designation), "Total Present (Days)", formatNumber(payslip.totalPresentDays)],
        ["Department", cleanText(departmentTitleCase), "Loss of Pay (Days)", formatNumber(payslip.lossOfPayDays || 0)],
        ["Date of Joining", joiningDate, "Net Pay", `Rs.${payslip.netPay.toLocaleString("en-IN")}`],
    ];

    // Define consistent column widths for 2-column tables
    const leftMargin = 40;
    const rightMargin = 40;
    const availableWidth = pageWidth - leftMargin - rightMargin;
    const firstColumnWidth = availableWidth * 0.6; // 60% for description
    const secondColumnWidth = availableWidth * 0.4; // 40% for amount

    // Column styles for 2-column tables (Earnings, Deductions, Description)
    const twoColumnStyles = {
        0: {
            fontStyle: "bold",
            cellWidth: firstColumnWidth,
        },
        1: {
            cellWidth: secondColumnWidth,
        }
    };

    // Base table options
    const baseTableOptions = {
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 10,
            textColor: [40, 40, 40],
            lineColor: [160, 160, 160],
            lineWidth: 0.2,
            cellPadding: 8,
            fillColor: false,
            minCellHeight: 12,
        },
        headStyles: {
            fillColor: "#D79A2F",
            textColor: 255,
            fontStyle: "bold",
            lineColor: [160, 160, 160],
            lineWidth: 0.2,
        },
        bodyStyles: {
            fillColor: false,
        },
        alternateRowStyles: {
            fillColor: false,
        },
        margin: { left: leftMargin, right: rightMargin },
        willDrawCell: (data) => {
            if (data.section === "body") {
                data.cell.styles.fillColor = false;
            }
        },
    };

    // Employee Info Table (4 columns)
    autoTable(doc, {
        startY: 160,
        body: employeeData,
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 120 },
            1: { cellWidth: 'auto' },
            2: { fontStyle: "bold", cellWidth: 120 },
            3: { cellWidth: 'auto' },
        },
        ...baseTableOptions,
    });

    // Earnings table with consistent column widths
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Earnings", "Amount (Rs.)"]],
        body: payslip.earnings.map((e) => [e.name, e.amount.toLocaleString("en-IN")]),
        columnStyles: twoColumnStyles,
        ...baseTableOptions,
    });

    // Deductions table with consistent column widths
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Deductions", "Amount (Rs.)"]],
        body: payslip.deductions.map((d) => [d.name, d.amount.toLocaleString("en-IN")]),
        columnStyles: twoColumnStyles,
        ...baseTableOptions,
    });

    // Description table with consistent column widths
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Description", "Amount (Rs.)"]],
        body: [
            ["Gross Payable", payslip.grossEarnings.toLocaleString("en-IN")],
            ["Total Deductions", payslip.totalDeductions.toLocaleString("en-IN")],
            [
                {
                    content: "Net Payable",
                    styles: {
                        fontStyle: "bold",
                        fillColor: false,
                    }
                },
                {
                    content: `Rs.${payslip.netPay.toLocaleString("en-IN")}`,
                    styles: {
                        fontStyle: "bold",
                        textColor: [0, 0, 0],
                        fillColor: false,
                    },
                },
            ],
        ],
        columnStyles: twoColumnStyles,
        ...baseTableOptions,
    });

    // Footer
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90);
    const footer1 = "Note: This is a system generated payslip and does not require any signature.";
    doc.text(footer1, pageWidth / 2, pageHeight - 40, { align: "center" });

    doc.save(`Payslip_${payslip.month}_${payslip.year}.pdf`);
}

// Image loader
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Date Formatter
function formatDate(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}