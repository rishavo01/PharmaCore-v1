const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ==========================================
// GET /api/suppliers - List suppliers with pagination & filtering
// ==========================================
const getSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let where = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { supplierCode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const validSortFields = [
      "companyName",
      "contactPerson",
      "phone",
      "email",
      "supplierCode",
      "status",
      "createdAt",
    ];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    const formatted = suppliers.map((s) => ({
      id: s.id,
      supplierCode: s.supplierCode,
      companyName: s.companyName,
      contactPerson: s.contactPerson || "",
      phone: s.phone,
      email: s.email || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      country: s.country || "",
      postalCode: s.postalCode || "",
      taxNumber: s.taxNumber || "",
      website: s.website || "",
      status: s.status,
      notes: s.notes || "",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      ordersCount: s._count.purchaseOrders,
    }));

    res.json({
      suppliers: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/suppliers/stats - Summary Card Stats
// ==========================================
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await prisma.supplier.count();
    const activeSuppliers = await prisma.supplier.count({
      where: { status: "ACTIVE" },
    });
    const pendingOrders = await prisma.purchaseOrder.count({
      where: { status: "PENDING" },
    });

    res.json({
      totalSuppliers,
      activeSuppliers,
      pendingOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/suppliers/regions - Regional Supply Distribution
// ==========================================
const getRegionalDistribution = async (req, res) => {
  try {
    const activeSuppliers = await prisma.supplier.findMany({
      where: { status: "ACTIVE" },
    });

    const total = activeSuppliers.length;
    const groups = {};

    activeSuppliers.forEach((s) => {
      const stateVal = s.state ? s.state.trim() : "";
      const reg = stateVal || s.city || "Local";
      groups[reg] = (groups[reg] || 0) + 1;
    });

    const data = Object.keys(groups).map((name) => {
      const count = groups[name];
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        label: `${name} Logistics`,
        value: `${percent}%`,
        color: percent >= 60 ? "bg-emerald-500" : percent >= 40 ? "bg-blue-500" : "bg-amber-500",
      };
    });

    // Default return if no data exists
    if (data.length === 0) {
      data.push({ label: "Local Hub", value: "100%", color: "bg-emerald-500" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/suppliers/stock-alerts - Suppliers linked to low stock medicines
// ==========================================
const getStockAlerts = async (req, res) => {
  try {
    const lowStockMedicines = await prisma.medicine.findMany({
      where: {
        quantity: { lte: 20 },
        supplierId: { not: null },
      },
      include: {
        supplier: true,
      },
    });

    const alertMap = {};
    lowStockMedicines.forEach((m) => {
      if (!m.supplier) return;
      const sId = m.supplier.id;
      if (!alertMap[sId]) {
        alertMap[sId] = {
          supplierId: sId,
          supplierName: m.supplier.companyName,
          affectedMedicines: 0,
        };
      }
      alertMap[sId].affectedMedicines += 1;
    });

    // Return the sorted alerts list (most affected first)
    const alerts = Object.values(alertMap).sort((a, b) => b.affectedMedicines - a.affectedMedicines);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/suppliers/:id - Get Single Supplier
// ==========================================
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        medicines: true,
        purchaseOrders: true,
      },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// POST /api/suppliers - Create Supplier
// ==========================================
const createSupplier = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      country,
      postalCode,
      taxNumber,
      website,
      notes,
    } = req.body;

    if (!companyName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Company Name and Phone Number are required fields.",
      });
    }

    // Email regex check if supplied
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: "A valid email format is required." });
      }
    }

    // Check unique phone number
    const existingPhone = await prisma.supplier.findFirst({
      where: { phone: phone.trim() },
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "A supplier with this Phone Number already exists.",
      });
    }

    // Generate unique code
    const supplierCode = `SUP-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        companyName: companyName.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : null,
        postalCode: postalCode ? postalCode.trim() : null,
        taxNumber: taxNumber ? taxNumber.trim() : null,
        website: website ? website.trim() : null,
        status: "ACTIVE",
        notes: notes ? notes.trim() : null,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUT /api/suppliers/:id - Update Supplier
// ==========================================
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      country,
      postalCode,
      taxNumber,
      website,
      status,
      notes,
    } = req.body;

    if (!companyName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Company Name and Phone Number are required fields.",
      });
    }

    // Email regex validation
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: "A valid email format is required." });
      }
    }

    // Phone duplicate validation
    const conflictPhone = await prisma.supplier.findFirst({
      where: {
        phone: phone.trim(),
        id: { not: parseInt(id) },
      },
    });
    if (conflictPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already occupied by another supplier.",
      });
    }

    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        companyName: companyName.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : null,
        postalCode: postalCode ? postalCode.trim() : null,
        taxNumber: taxNumber ? taxNumber.trim() : null,
        website: website ? website.trim() : null,
        status: status || undefined,
        notes: notes ? notes.trim() : null,
      },
    });

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE /api/suppliers/:id - Soft Delete / Deactivate Supplier
// ==========================================
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { status: "INACTIVE" },
    });

    res.json({ success: true, message: "Supplier deactivated successfully.", supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/suppliers/export - Export report formats
// ==========================================
const exportSuppliers = async (req, res) => {
  try {
    const { format = "csv", search = "", status = "" } = req.query;

    let where = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { supplierCode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { companyName: "asc" },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    });

    const now = new Date();

    if (format === "csv") {
      let csv = "Supplier Code,Company Name,Contact Person,Phone,Email,Address,City,State,Status,Orders Count\n";
      suppliers.forEach((s) => {
        csv += `"${s.supplierCode}","${s.companyName.replace(/"/g, '""')}","${(s.contactPerson || "").replace(/"/g, '""')}","${s.phone}","${s.email || ""}","${(s.address || "").replace(/"/g, '""')}","${s.city || ""}","${s.state || ""}","${s.status}",${s._count.purchaseOrders}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=suppliers_report.csv");
      return res.status(200).send(csv);
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Suppliers Network");

      sheet.addRow(["PharmaCore Supplier Network Report"]);
      sheet.addRow([`Exported on: ${now.toLocaleString()}`]);
      sheet.addRow([]);

      sheet.addRow(["Code", "Company Name", "Contact Person", "Phone", "Email", "City", "State", "Status", "Orders"]);
      suppliers.forEach((s) => {
        sheet.addRow([
          s.supplierCode,
          s.companyName,
          s.contactPerson || "",
          s.phone,
          s.email || "",
          s.city || "",
          s.state || "",
          s.status,
          s._count.purchaseOrders,
        ]);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=suppliers_report.xlsx");
      await workbook.xlsx.write(res);
      return res.end();
    } else if (format === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=suppliers_report.pdf");
      doc.pipe(res);

      doc.fontSize(20).text("PharmaCore Supplier Catalog", { align: "center" });
      doc.fontSize(10).text(`Generated: ${now.toLocaleString()}`, { align: "center" });
      doc.moveDown();

      suppliers.forEach((s, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${s.companyName} [Code: ${s.supplierCode}] - Status: ${s.status}`, { underline: true });
        doc.fontSize(9).text(`   Contact: ${s.contactPerson || "N/A"} (Phone: ${s.phone}, Email: ${s.email || "N/A"})`);
        doc.text(`   Address: ${s.address || ""}, ${s.city || ""}, ${s.state || ""} (Website: ${s.website || "N/A"})`);
        doc.text(`   Total Purchase Orders Placed: ${s._count.purchaseOrders}`);
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    } else {
      res.status(400).json({ success: false, message: "Invalid format. Supported: csv, xlsx, pdf" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getRegionalDistribution,
  getStockAlerts,
  exportSuppliers,
};
