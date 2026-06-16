const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Helper: Calculate date ranges for Daily, Weekly, Monthly, Yearly
const getPeriodDates = (period) => {
  const now = new Date();
  let currentStart, currentEnd, previousStart, previousEnd;

  if (period === "daily" || period === "today") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
    previousEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "weekly") {
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMonday, 0, 0, 0, 0);
    currentEnd = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    previousEnd = new Date(currentEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "monthly") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // yearly
    currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

// Helper: Get Chart Data from DB using Raw SQL aggregations
const getChartDataForPeriod = async (period, start, end) => {
  let salesData = [];
  if (period === "daily" || period === "today") {
    salesData = await prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM "createdAt")::int as key, SUM("totalAmount")::double precision as revenue
      FROM "Sale"
      WHERE "status" = 'Completed' AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY key;
    `;
  } else if (period === "weekly") {
    salesData = await prisma.$queryRaw`
      SELECT EXTRACT(ISODOW FROM "createdAt")::int as key, SUM("totalAmount")::double precision as revenue
      FROM "Sale"
      WHERE "status" = 'Completed' AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY key;
    `;
  } else if (period === "monthly") {
    salesData = await prisma.$queryRaw`
      SELECT EXTRACT(DAY FROM "createdAt")::int as key, SUM("totalAmount")::double precision as revenue
      FROM "Sale"
      WHERE "status" = 'Completed' AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY key;
    `;
  } else if (period === "yearly") {
    salesData = await prisma.$queryRaw`
      SELECT EXTRACT(MONTH FROM "createdAt")::int as key, SUM("totalAmount")::double precision as revenue
      FROM "Sale"
      WHERE "status" = 'Completed' AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY key;
    `;
  }

  let labels = [];
  let revenue = [];

  if (period === "daily" || period === "today") {
    labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
    revenue = Array(24).fill(0);
    salesData.forEach((item) => {
      const hour = item.key;
      if (hour >= 0 && hour < 24) {
        revenue[hour] = item.revenue;
      }
    });
  } else if (period === "weekly") {
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    revenue = Array(7).fill(0);
    salesData.forEach((item) => {
      const dow = item.key;
      if (dow >= 1 && dow <= 7) {
        revenue[dow - 1] = item.revenue;
      }
    });
  } else if (period === "monthly") {
    const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    revenue = Array(daysInMonth).fill(0);
    salesData.forEach((item) => {
      const day = item.key;
      if (day >= 1 && day <= daysInMonth) {
        revenue[day - 1] = item.revenue;
      }
    });
  } else if (period === "yearly") {
    labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    revenue = Array(12).fill(0);
    salesData.forEach((item) => {
      const month = item.key;
      if (month >= 1 && month <= 12) {
        revenue[month - 1] = item.revenue;
      }
    });
  }

  return { labels, revenue };
};

// GET /api/reports/summary
const getSummary = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodDates(period);

    // Current period metrics
    const currentSales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    let currentRevenue = 0;
    let currentCost = 0;
    const currentOrders = currentSales.length;

    currentSales.forEach((s) => {
      currentRevenue += s.totalAmount;
      s.items.forEach((item) => {
        currentCost += item.quantity * (item.medicine?.buyPrice || 0);
      });
    });
    const currentProfit = currentRevenue - currentCost;

    // Previous period metrics
    const previousSales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    let previousRevenue = 0;
    let previousCost = 0;
    const previousOrders = previousSales.length;

    previousSales.forEach((s) => {
      previousRevenue += s.totalAmount;
      s.items.forEach((item) => {
        previousCost += item.quantity * (item.medicine?.buyPrice || 0);
      });
    });
    const previousProfit = previousRevenue - previousCost;

    // Calculate deltas
    const calculateDelta = (curr, prev) => {
      if (prev > 0) return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
      if (curr > 0) return 100;
      return 0;
    };

    const revenueDelta = calculateDelta(currentRevenue, previousRevenue);
    const salesDelta = calculateDelta(currentOrders, previousOrders);
    const profitDelta = calculateDelta(currentProfit, previousProfit);

    res.json({
      revenue: currentRevenue,
      revenueDelta,
      sales: currentOrders,
      salesDelta,
      profit: currentProfit,
      profitDelta,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/chart
const getChart = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    const { currentStart, currentEnd } = getPeriodDates(period);
    const chartData = await getChartDataForPeriod(period, currentStart, currentEnd);

    res.json({
      period,
      labels: chartData.labels,
      revenue: chartData.revenue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/categories
const getCategories = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    const { currentStart, currentEnd } = getPeriodDates(period);

    const sales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    const categoryMap = {};
    let totalItems = 0;

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.medicine) {
          const cat = item.medicine.category || "Other";
          categoryMap[cat] = (categoryMap[cat] || 0) + item.quantity;
          totalItems += item.quantity;
        }
      });
    });

    const colors = [
      "bg-emerald-600",
      "bg-blue-600",
      "bg-emerald-400",
      "bg-slate-300",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-600",
    ];

    const categoriesData = Object.keys(categoryMap)
      .map((cat, idx) => {
        const pct = totalItems > 0 ? Math.round((categoryMap[cat] / totalItems) * 100) : 0;
        return {
          label: cat,
          value: `${pct}%`,
          color: colors[idx % colors.length],
        };
      })
      .sort((a, b) => parseInt(b.value) - parseInt(a.value));

    res.json(categoriesData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/top-medicines
const getTopMedicines = async (req, res) => {
  try {
    const { period = "weekly", search = "" } = req.query;
    const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodDates(period);

    // Current Sales
    const currentSales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    // Previous Sales
    const previousSales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    const currentMedMap = {};
    currentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.medicine) {
          const medId = item.medicineId;
          if (!currentMedMap[medId]) {
            currentMedMap[medId] = {
              id: medId,
              name: item.medicine.name,
              category: item.medicine.category,
              units: 0,
              revenue: 0,
            };
          }
          currentMedMap[medId].units += item.quantity;
          currentMedMap[medId].revenue += item.totalPrice;
        }
      });
    });

    const previousMedMap = {};
    previousSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.medicine) {
          const medId = item.medicineId;
          if (!previousMedMap[medId]) {
            previousMedMap[medId] = { units: 0 };
          }
          previousMedMap[medId].units += item.quantity;
        }
      });
    });

    let topMeds = Object.values(currentMedMap);

    if (search) {
      const q = search.toLowerCase();
      topMeds = topMeds.filter(
        (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      );
    }

    const result = topMeds
      .map((m) => {
        const prevUnits = previousMedMap[m.id]?.units || 0;
        let growthPct = 0;
        if (prevUnits > 0) {
          growthPct = ((m.units - prevUnits) / prevUnits) * 100;
        } else if (m.units > 0) {
          growthPct = 100;
        }
        growthPct = Math.round(growthPct * 10) / 10;

        let status = "Stable";
        let color = "text-blue-600";
        let bg = "bg-blue-50";

        if (growthPct > 10) {
          status = "Trending";
          color = "text-emerald-600";
          bg = "bg-emerald-50";
        } else if (growthPct < -10) {
          status = "Declining";
          color = "text-rose-600";
          bg = "bg-rose-50";
        }

        return {
          name: m.name,
          units: m.units.toLocaleString(),
          revenue: m.revenue,
          growth: `${growthPct >= 0 ? "+" : ""}${growthPct}%`,
          status,
          color,
          bg,
        };
      })
      .sort((a, b) => parseInt(b.units.replace(/,/g, "")) - parseInt(a.units.replace(/,/g, "")));

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/export
const exportReport = async (req, res) => {
  try {
    const { format = "csv", period = "weekly" } = req.query;
    const { currentStart, currentEnd } = getPeriodDates(period);

    // Fetch reports data elements
    const sales = await prisma.sale.findMany({
      where: {
        status: "Completed",
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const totalSalesCount = sales.length;
    const categoryMap = {};
    const medicineMap = {};

    sales.forEach((s) => {
      totalRevenue += s.totalAmount;
      s.items.forEach((item) => {
        if (item.medicine) {
          const cat = item.medicine.category || "Other";
          categoryMap[cat] = (categoryMap[cat] || 0) + item.quantity;

          const medName = item.medicine.name;
          if (!medicineMap[medName]) {
            medicineMap[medName] = { units: 0, revenue: 0 };
          }
          medicineMap[medName].units += item.quantity;
          medicineMap[medName].revenue += item.totalPrice;

          totalCost += item.quantity * (item.medicine.buyPrice || 0);
        }
      });
    });

    const netProfit = totalRevenue - totalCost;
    const averageOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    // Retrieve chart timeline elements
    const chartData = await getChartDataForPeriod(period, currentStart, currentEnd);

    if (format === "csv") {
      let csv = `=== PHARMACORE SYSTEM REPORTS & ANALYTICS ===\n`;
      csv += `Period,${period.toUpperCase()}\n`;
      csv += `Date Range,${currentStart.toLocaleDateString()} to ${currentEnd.toLocaleDateString()}\n`;
      csv += `Exported At,${new Date().toLocaleString()}\n\n`;

      csv += `--- OVERALL METRICS ---\n`;
      csv += `Total Revenue,Rs.${totalRevenue.toFixed(2)}\n`;
      csv += `Total Sales count,${totalSalesCount} Orders\n`;
      csv += `Average Order Value,Rs.${averageOrderValue.toFixed(2)}\n`;
      csv += `Net Profit,Rs.${netProfit.toFixed(2)}\n\n`;

      csv += `--- PERFORMANCE CHART TIMELINE ---\n`;
      csv += `Label,Revenue\n`;
      chartData.labels.forEach((lbl, idx) => {
        csv += `"${lbl}",Rs.${chartData.revenue[idx].toFixed(2)}\n`;
      });
      csv += `\n`;

      csv += `--- TOP SELLING CATEGORIES ---\n`;
      csv += `Category Name,Units Sold\n`;
      Object.keys(categoryMap).forEach((cat) => {
        csv += `"${cat}",${categoryMap[cat]}\n`;
      });
      csv += `\n`;

      csv += `--- TOP SELLING MEDICINES ---\n`;
      csv += `Medicine Name,Units Sold,Revenue Generated\n`;
      Object.keys(medicineMap).forEach((name) => {
        csv += `"${name}",${medicineMap[name].units},Rs.${medicineMap[name].revenue.toFixed(2)}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=reports-${period}.csv`);
      return res.status(200).send(csv);
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      
      // Sheet 1: Dashboard Reports
      const sheet = workbook.addWorksheet("Operational Summary");

      sheet.addRow(["PharmaCore Analytics Report"]);
      sheet.addRow([`Period: ${period.toUpperCase()}`]);
      sheet.addRow([`Date Range: ${currentStart.toLocaleDateString()} to ${currentEnd.toLocaleDateString()}`]);
      sheet.addRow([`Exported on: ${new Date().toLocaleString()}`]);
      sheet.addRow([]);

      sheet.addRow(["KPI Summary Metrics"]);
      sheet.addRow(["Metric", "Value"]);
      sheet.addRow(["Total Completed Revenue", `Rs.${totalRevenue.toFixed(2)}`]);
      sheet.addRow(["Total Sales orders", totalSalesCount]);
      sheet.addRow(["Average Order Value", `Rs.${averageOrderValue.toFixed(2)}`]);
      sheet.addRow(["Calculated Net Profit", `Rs.${netProfit.toFixed(2)}`]);
      sheet.addRow([]);

      sheet.addRow(["Top Selling Categories"]);
      sheet.addRow(["Category", "Units Sold"]);
      Object.keys(categoryMap).forEach((cat) => {
        sheet.addRow([cat, categoryMap[cat]]);
      });
      sheet.addRow([]);

      sheet.addRow(["Top Selling Medicines"]);
      sheet.addRow(["Medicine Name", "Units Sold", "Revenue"]);
      Object.keys(medicineMap).forEach((name) => {
        sheet.addRow([name, medicineMap[name].units, medicineMap[name].revenue]);
      });

      // Sheet 2: Chart performance timeline details
      const timelineSheet = workbook.addWorksheet("Chart Timeline");
      timelineSheet.addRow(["PharmaCore Chart Performance Timeline"]);
      timelineSheet.addRow([`Period: ${period.toUpperCase()}`]);
      timelineSheet.addRow([]);
      timelineSheet.addRow(["Timeline Label", "Revenue (Rs.)"]);
      chartData.labels.forEach((lbl, idx) => {
        timelineSheet.addRow([lbl, chartData.revenue[idx]]);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=reports-${period}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else if (format === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=reports-${period}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).text("PharmaCore Performance Reports", { align: "center" });
      doc.fontSize(10).text(`Period: ${period.toUpperCase()}`, { align: "center" });
      doc.text(`Range: ${currentStart.toLocaleDateString()} to ${currentEnd.toLocaleDateString()}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text("Summary Analytics KPIs", { underline: true });
      doc.fontSize(11).text(`- Total Revenue: Rs.${totalRevenue.toFixed(2)}`);
      doc.text(`- Completed Sales: ${totalSalesCount} Orders`);
      doc.text(`- Average Order Value: Rs.${averageOrderValue.toFixed(2)}`);
      doc.text(`- Calculated Net Profit: Rs.${netProfit.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(14).text("Performance Chart Timeline", { underline: true });
      chartData.labels.forEach((lbl, idx) => {
        doc.fontSize(10).text(`- ${lbl}: Rs.${chartData.revenue[idx].toFixed(2)}`);
      });
      doc.moveDown();

      doc.fontSize(14).text("Category Performance Overview", { underline: true });
      Object.keys(categoryMap).forEach((cat) => {
        doc.fontSize(10).text(`* ${cat}: ${categoryMap[cat]} units`);
      });
      doc.moveDown();

      doc.fontSize(14).text("Medicines Sales Rankings", { underline: true });
      Object.keys(medicineMap).forEach((name) => {
        doc.fontSize(10).text(`* ${name} - Units: ${medicineMap[name].units} (Rs.${medicineMap[name].revenue.toFixed(2)} Revenue)`);
      });

      doc.end();
      return;
    } else {
      res.status(400).json({ success: false, message: "Invalid format. Supported: pdf, csv, xlsx." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSummary,
  getChart,
  getCategories,
  getTopMedicines,
  exportReport,
};
