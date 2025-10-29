import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOGO_PATH = "/realbeez.png";
const WATERMARK_PATH = "/icons/watermark.png";

export async function generatePDF(payslip) {
    if (!payslip || !payslip.employee) {
        console.error("❌ Missing payslip data!", payslip);
        return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const watermark = await loadImage(WATERMARK_PATH);
    const logo = await loadImage(LOGO_PATH);

    // ✅ Watermark (centered with opacity - similar to your reference image)
    const wmRatio = watermark.width / watermark.height;
    let wmWidth = pageWidth * 0.7; // Slightly smaller for better appearance
    let wmHeight = wmWidth / wmRatio;
    if (wmHeight > pageHeight * 0.7) {
        wmHeight = pageHeight * 0.7;
        wmWidth = wmHeight * wmRatio;
    }
    const wmX = (pageWidth - wmWidth) / 2;
    const wmY = (pageHeight - wmHeight) / 2;

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 })); // Increased opacity for better visibility
    doc.addImage(watermark, "PNG", wmX, wmY, wmWidth, wmHeight);
    doc.restoreGraphicsState();

    // ✅ Logo (centered)
    const logoRatio = logo.width / logo.height;
    const logoWidth = 120;
    const logoHeight = logoWidth / logoRatio;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, 35, logoWidth, logoHeight);

    // ✅ Company Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("REAL BEEZ ESTATES PVT LTD", pageWidth / 2, 90, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(
        "2nd Floor, YS RAO Towers, Madhapur Rd, Sri Rama Colony, Jubilee Hills, Hyderabad, Telangana - 500033",
        pageWidth / 2,
        105,
        { align: "center" }
    );

    // ✅ Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Salary Slip: ${payslip.month} ${payslip.year}`, pageWidth / 2, 135, { align: "center" });

    // ✅ Helpers
    const departmentTitleCase =
        payslip.employee.department?.charAt(0).toUpperCase() +
        payslip.employee.department?.slice(1).toLowerCase();
    const joiningDate = formatDate(payslip.employee.dateOfJoining);
    const cleanText = (txt) => String(txt || "").replace(/[¹()]/g, "").trim();

    // ✅ Employee Info
    const employeeData = [
        ["Employee Name", cleanText(payslip.employee.name), "Bank A/C", cleanText(payslip.employee.account)],
        ["Employee Code", cleanText(payslip.employee.code), "IFSC", cleanText(payslip.employee.ifsc)],
        ["Designation", cleanText(payslip.employee.designation), "Pay Days", `${payslip.totalPresentDays}`],
        ["Department", cleanText(departmentTitleCase), "Loss of Pay (Days)", `${payslip.lossOfPayDays || 0}`],
        ["Date of Joining", joiningDate, "Net Pay", `Rs.${payslip.netPay.toLocaleString("en-IN")}`],
    ];

    // ✅ Enhanced transparent table renderer
    const transparentTableOptions = {
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 10,
            textColor: [40, 40, 40],
            lineColor: [160, 160, 160],
            lineWidth: 0.2,
            cellPadding: 4,
            fillColor: false, // No fill color for body cells
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
            fillColor: false, // Transparent body
        },
        alternateRowStyles: {
            fillColor: false, // No alternate row coloring
        },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 'auto' },
            2: { fontStyle: "bold", cellWidth: 'auto' },
        },
        // ✅ Custom cell drawing for complete transparency
        didDrawCell: (data) => {
            if (data.section === "body") {
                // Ensure no background fill for body cells
                doc.setFillColor(255, 255, 255, 0);
            }
        },
        willDrawCell: (data) => {
            // Prevent any automatic filling for body cells
            if (data.section === "body") {
                data.cell.styles.fillColor = false;
            }
        },
    };

    // ✅ Apply tables with transparent backgrounds
    autoTable(doc, {
        startY: 160,
        body: employeeData,
        ...transparentTableOptions
    });

    // ✅ Earnings table
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Earnings", "Amount (Rs.)"]],
        body: payslip.earnings.map((e) => [cleanText(e.name), e.amount.toLocaleString("en-IN")]),
        ...transparentTableOptions,
    });

    // ✅ Deductions table
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Deductions", "Amount (Rs.)"]],
        body: payslip.deductions.map((d) => [cleanText(d.name), d.amount.toLocaleString("en-IN")]),
        ...transparentTableOptions,
    });

    // ✅ Gross + Net Pay table
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
                        fillColor: false, // Transparent for net pay row too
                    }
                },
                {
                    content: `Rs.${payslip.netPay.toLocaleString("en-IN")}`,
                    styles: {
                        fontStyle: "bold",
                        textColor: [0, 0, 0],
                        fillColor: false, // Transparent background
                    },
                },
            ],
        ],
        ...transparentTableOptions,
    });

    // ✅ Footer
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90);
    const footer1 = "Note: This is a system generated payslip and does not require any signature.";
    doc.text(footer1, pageWidth / 2, pageHeight - 40, { align: "center" });

    doc.save(`Payslip_${payslip.month}_${payslip.year}.pdf`);
}

// ✅ Image loader
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// ✅ Date Formatter
function formatDate(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}