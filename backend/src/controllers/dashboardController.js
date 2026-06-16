const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ==========================================
// GET /api/dashboard/summary - Stats overview widgets
// ==========================================
const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Total active medicines
    const totalMedicines = await prisma.medicine.count();

    // Low stock medicines (quantity <= 20)
    const lowStockCount = await prisma.medicine.count({
      where: { quantity: { lte: 20 } },
    });

    // Expiring soon (expiry date within 30 days)
    const expiringCount = await prisma.medicine.count({
      where: {
        expiryDate: {
          gte: now,
          lte: soon,
        },
      },
    });

    // Today's completed sales
    const todaySalesAggregate = await prisma.sale.aggregate({
      where: {
        status: "Completed",
        createdAt: { gte: startOfToday },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const todayRevenue = todaySalesAggregate._sum.totalAmount || 0;
    const todayOrders = todaySalesAggregate._count.id || 0;

    // Yesterday's completed sales (for delta growth percentage)
    const yesterdaySalesAggregate = await prisma.sale.aggregate({
      where: {
        status: "Completed",
        createdAt: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
      },
      _sum: { totalAmount: true },
    });

    const yesterdayRevenue = yesterdaySalesAggregate._sum.totalAmount || 0;
    let growth = 0;
    if (yesterdayRevenue > 0) {
      growth = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    } else if (todayRevenue > 0) {
      growth = 100;
    }

    res.json({
      totalMedicines,
      lowStockCount,
      expiringCount,
      todaySales: todayRevenue,
      todayRevenue,
      todayOrders,
      todaySalesDelta: Math.round(growth * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/dashboard/revenue - Chart timeline revenue
// ==========================================
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    const now = new Date();
    let data = [];

    if (period === "weekly") {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);

      const sales = await prisma.sale.findMany({
        where: {
          status: "Completed",
          createdAt: { gte: startOfWeek },
        },
        orderBy: { createdAt: "asc" },
      });

      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const dayMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = dayNames[d.getDay()];
        dayMap[dayName] = 0;
      }

      sales.forEach((sale) => {
        const dayName = dayNames[new Date(sale.createdAt).getDay()];
        if (dayMap[dayName] !== undefined) {
          dayMap[dayName] += sale.totalAmount;
        }
      });

      data = Object.keys(dayMap).map((label) => ({ label, revenue: dayMap[label] }));
    } else {
      // monthly
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sales = await prisma.sale.findMany({
        where: {
          status: "Completed",
          createdAt: { gte: startOfMonth },
        },
        orderBy: { createdAt: "asc" },
      });

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayMap = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dayMap[`${i}`] = 0;
      }

      sales.forEach((sale) => {
        const dateNum = new Date(sale.createdAt).getDate();
        dayMap[`${dateNum}`] += sale.totalAmount;
      });

      data = Object.keys(dayMap).map((label) => ({ label, revenue: dayMap[label] }));
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/dashboard/recent-activity - Recent Sales
// ==========================================
const getRecentActivity = async (req, res) => {
  try {
    const limitNum = parseInt(req.query.limit) || 10;
    const sales = await prisma.sale.findMany({
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const formatted = sales.map((sale) => {
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        status: sale.status,
        itemCount,
        totalAmount: sale.totalAmount,
        createdAt: sale.createdAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/dashboard/alerts - Low Stock & Expiry triggers
// ==========================================
const getAlerts = async (req, res) => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const alerts = [];

    // Query critical stock levels
    const lowStockMeds = await prisma.medicine.findMany({
      where: { quantity: { lte: 20 } },
      orderBy: { quantity: "asc" },
      take: 10,
    });

    lowStockMeds.forEach((m) => {
      alerts.push({
        id: `low-${m.id}`,
        name: m.name,
        detail: `Stock critical: ${m.quantity} units`,
        type: "Order",
      });
    });

    // Query expiring soon
    const expiringMeds = await prisma.medicine.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: soon,
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 10,
    });

    expiringMeds.forEach((m) => {
      const formattedDate = new Date(m.expiryDate).toLocaleDateString();
      alerts.push({
        id: `exp-${m.id}`,
        name: m.name,
        detail: `Expires ${formattedDate}`,
        type: "Disposal",
      });
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/dashboard/export - Generates reports PDF/CSV/Excel
// ==========================================
const exportDashboardData = async (req, res) => {
  try {
    const { format = "csv" } = req.query;

    // Fetch dashboard components data
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalMedicines = await prisma.medicine.count();
    const lowStockMeds = await prisma.medicine.findMany({
      where: { quantity: { lte: 20 } },
      orderBy: { quantity: "asc" },
    });
    const expiringMeds = await prisma.medicine.findMany({
      where: { expiryDate: { gte: now, lte: soon } },
      orderBy: { expiryDate: "asc" },
    });

    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    const totalRevenueAggregate = await prisma.sale.aggregate({
      where: { status: "Completed" },
      _sum: { totalAmount: true },
    });
    const totalRevenue = totalRevenueAggregate._sum.totalAmount || 0;

    if (format === "csv") {
      // Formulate CSV lines
      let csv = "=== PHARMACORE CLINICAL DASHBOARD EXPORT ===\n";
      csv += `Generated At,${now.toLocaleString()}\n\n`;

      csv += "--- SUMMARY WIDGETS ---\n";
      csv += `Total Medicines,${totalMedicines}\n`;
      csv += `Low Stock Count,${lowStockMeds.length}\n`;
      csv += `Expiring in 30 Days,${expiringMeds.length}\n`;
      csv += `Total Lifetime Completed Revenue,Rs.${totalRevenue.toFixed(2)}\n\n`;

      csv += "--- LOW STOCK LIST ---\n";
      csv += "Medicine Name,Category,Quantity left,Sell Price\n";
      lowStockMeds.forEach((m) => {
        csv += `"${m.name}","${m.category}",${m.quantity},${m.sellPrice}\n`;
      });
      csv += "\n";

      csv += "--- EXPIRING MEDICINES (30 DAYS) ---\n";
      csv += "Medicine Name,Category,Quantity left,Expiry Date\n";
      expiringMeds.forEach((m) => {
        csv += `"${m.name}","${m.category}",${m.quantity},"${new Date(m.expiryDate).toLocaleDateString()}"\n`;
      });
      csv += "\n";

      csv += "--- RECENT SALES TRANSACTIONS (LATEST 10) ---\n";
      csv += "Invoice ID,Customer Name,Date & Time,Status,Total Amount\n";
      recentSales.forEach((s) => {
        csv += `"${s.invoiceNumber}","${s.customerName}","${new Date(s.createdAt).toLocaleString()}","${s.status}",Rs.${s.totalAmount.toFixed(2)}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=dashboard_report.csv");
      return res.status(200).send(csv);
    } else if (format === "xlsx") {
      // Formulate Excel Workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Dashboard Summary");

      // Title
      sheet.addRow(["PharmaCore Clinical Overview Report"]);
      sheet.addRow([`Exported on: ${now.toLocaleString()}`]);
      sheet.addRow([]);

      // Summary Widgets
      sheet.addRow(["KPI Summary Metrics"]);
      sheet.addRow(["Metric Name", "Value"]);
      sheet.addRow(["Total Medicines", totalMedicines]);
      sheet.addRow(["Low Stock Count", lowStockMeds.length]);
      sheet.addRow(["Expiring Medicines (30 Days)", expiringMeds.length]);
      sheet.addRow(["Total Completed Revenue", `Rs.${totalRevenue.toFixed(2)}`]);
      sheet.addRow([]);

      // Low stock table
      sheet.addRow(["Low Stock Inventory Items"]);
      sheet.addRow(["ID", "Name", "Category", "Quantity Left", "Sell Price"]);
      lowStockMeds.forEach((m) => {
        sheet.addRow([m.id, m.name, m.category, m.quantity, m.sellPrice]);
      });
      sheet.addRow([]);

      // Expiring table
      sheet.addRow(["Expiring Medical Items (30 Days)"]);
      sheet.addRow(["ID", "Name", "Category", "Quantity Left", "Expiry Date"]);
      expiringMeds.forEach((m) => {
        sheet.addRow([m.id, m.name, m.category, m.quantity, new Date(m.expiryDate).toLocaleDateString()]);
      });
      sheet.addRow([]);

      // Recent Activity
      sheet.addRow(["Recent Billing Activity"]);
      sheet.addRow(["Invoice Number", "Customer Name", "Date", "Status", "Amount"]);
      recentSales.forEach((s) => {
        sheet.addRow([s.invoiceNumber, s.customerName, new Date(s.createdAt).toLocaleString(), s.status, s.totalAmount]);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=dashboard_report.xlsx");
      await workbook.xlsx.write(res);
      return res.end();
    } else if (format === "pdf") {
      // Formulate PDF Document
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=dashboard_report.pdf");

      doc.pipe(res);

      // Title
      doc.fontSize(20).text("PharmaCore Pharmacy Reports", { align: "center" });
      doc.fontSize(10).text(`Generated: ${now.toLocaleString()}`, { align: "center" });
      doc.moveDown();

      // Summary
      doc.fontSize(14).text("Dashboard KPI Summary", { underline: true });
      doc.fontSize(11).text(`- Total Active Medicines in Catalog: ${totalMedicines}`);
      doc.text(`- Low Stock Alerts count: ${lowStockMeds.length}`);
      doc.text(`- Expiring Medicines count (30 days): ${expiringMeds.length}`);
      doc.text(`- Total Revenue Collected: Rs.${totalRevenue.toFixed(2)}`);
      doc.moveDown();

      // Low Stock
      doc.fontSize(14).text("Critical Low Stock Items (Quantity <= 20)", { underline: true });
      lowStockMeds.forEach((m) => {
        doc.fontSize(10).text(`${m.name} [Category: ${m.category}] - Qty Left: ${m.quantity} (Rs.${m.sellPrice.toFixed(2)})`);
      });
      doc.moveDown();

      // Expiring
      doc.fontSize(14).text("Medicines Expiring Soon (30 Days)", { underline: true });
      expiringMeds.forEach((m) => {
        doc.fontSize(10).text(`${m.name} [Category: ${m.category}] - Exp Date: ${new Date(m.expiryDate).toLocaleDateString()} (Qty: ${m.quantity})`);
      });
      doc.moveDown();

      // Recent Activity
      doc.fontSize(14).text("Recent Activity Logging", { underline: true });
      recentSales.forEach((s) => {
        doc.fontSize(10).text(`${s.invoiceNumber} - ${s.customerName} - Total: Rs.${s.totalAmount.toFixed(2)} - Status: [${s.status}]`);
      });

      doc.end();
      return;
    } else {
      return res.status(400).json({ success: false, message: "Invalid format argument. Supported: pdf, csv, xlsx." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSummary,
  getRevenueAnalytics,
  getRecentActivity,
  getAlerts,
  exportDashboardData,
};