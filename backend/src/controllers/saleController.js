const prisma = require("../config/prisma");

// ==========================================
// GET /api/sales - List sales with filters & pagination
// ==========================================
const getSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      paymentMethod = "",
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let where = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        {
          customer: {
            phone: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: {
            include: {
              medicine: true,
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      sales,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/sales/:id - Get detailed sale by ID
// ==========================================
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// POST /api/sales - Create new sale (Atomic Transaction with Customer Registration)
// ==========================================
const createSale = async (req, res) => {
  try {
    const {
      customerPhone,
      customerName,
      customerEmail,
      customerAddress,
      paymentMethod,
      status = "Completed",
      discount = 0,
      taxRate = 0,
      items = [],
      clinicalNotes,
      notes,
    } = req.body;

    if (!customerPhone || !customerName || !paymentMethod || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customerPhone, customerName, paymentMethod, and items cannot be empty.",
      });
    }

    // Auto-generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const newSale = await prisma.$transaction(async (tx) => {
      // 1. Fetch or create Customer atomically
      let customer = await tx.customer.findUnique({
        where: { phone: customerPhone },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
            address: customerAddress || null,
          },
        });
      } else {
        // Update customer details if cashier changed them
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName || customer.name,
            email: customerEmail !== undefined ? customerEmail : customer.email,
            address: customerAddress !== undefined ? customerAddress : customer.address,
          },
        });
      }

      // 2. Validate inventory stock
      const saleItemsData = [];
      let calculatedSubtotal = 0;

      for (const item of items) {
        const med = await tx.medicine.findUnique({
          where: { id: parseInt(item.medicineId) },
        });

        if (!med) {
          throw new Error(`Medicine with ID ${item.medicineId} not found.`);
        }

        if (med.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${med.name}. Available: ${med.quantity}, Requested: ${item.quantity}`);
        }

        // Reduce stock
        await tx.medicine.update({
          where: { id: med.id },
          data: { quantity: med.quantity - item.quantity },
        });

        const itemTotalPrice = item.quantity * med.sellPrice;
        calculatedSubtotal += itemTotalPrice;

        saleItemsData.push({
          medicineId: med.id,
          quantity: item.quantity,
          unitPrice: med.sellPrice,
          totalPrice: itemTotalPrice,
        });
      }

      const taxAmount = calculatedSubtotal * (taxRate / 100);
      const finalTotal = calculatedSubtotal + taxAmount - discount;

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          customerName: customer.name,
          paymentMethod,
          status,
          subtotal: calculatedSubtotal,
          discount,
          tax: taxAmount,
          totalAmount: finalTotal,
          clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : (notes !== undefined ? notes : null),
          items: {
            create: saleItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return sale;
    });

    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUT /api/sales/:id - Edit pending sales
// ==========================================
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerPhone,
      customerName,
      customerEmail,
      customerAddress,
      paymentMethod,
      status,
      discount = 0,
      taxRate = 0,
      items = [],
      clinicalNotes,
      notes,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!existingSale) {
        throw new Error("Sale not found.");
      }

      if (existingSale.status !== "Pending") {
        throw new Error("Only sales with Pending status can be modified.");
      }

      // 1. Resolve customer updates
      let customer;
      if (customerPhone) {
        customer = await tx.customer.findUnique({ where: { phone: customerPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: customerName || "Unknown",
              phone: customerPhone,
              email: customerEmail || null,
              address: customerAddress || null,
            },
          });
        } else {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: customerName || customer.name,
              email: customerEmail !== undefined ? customerEmail : customer.email,
              address: customerAddress !== undefined ? customerAddress : customer.address,
            },
          });
        }
      }

      // 2. Restore stock of original items
      for (const item of existingSale.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // 3. Validate and deduct stock of updated items
      const saleItemsData = [];
      let calculatedSubtotal = 0;

      for (const item of items) {
        const med = await tx.medicine.findUnique({
          where: { id: parseInt(item.medicineId) },
        });

        if (!med) {
          throw new Error(`Medicine with ID ${item.medicineId} not found.`);
        }

        if (med.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${med.name}. Available: ${med.quantity}, Requested: ${item.quantity}`);
        }

        // Deduct updated stock
        await tx.medicine.update({
          where: { id: med.id },
          data: { quantity: { decrement: item.quantity } },
        });

        const itemTotalPrice = item.quantity * med.sellPrice;
        calculatedSubtotal += itemTotalPrice;

        saleItemsData.push({
          medicineId: med.id,
          quantity: item.quantity,
          unitPrice: med.sellPrice,
          totalPrice: itemTotalPrice,
        });
      }

      // 4. Clear existing items
      await tx.saleItem.deleteMany({
        where: { saleId: existingSale.id },
      });

      const taxAmount = calculatedSubtotal * (taxRate / 100);
      const finalTotal = calculatedSubtotal + taxAmount - discount;

      // 5. Update sale details
      const sale = await tx.sale.update({
        where: { id: existingSale.id },
        data: {
          customerId: customer ? customer.id : existingSale.customerId,
          customerName: customer ? customer.name : existingSale.customerName,
          paymentMethod,
          status: status || existingSale.status,
          subtotal: calculatedSubtotal,
          discount,
          tax: taxAmount,
          totalAmount: finalTotal,
          clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : (notes !== undefined ? notes : undefined),
          items: {
            create: saleItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return sale;
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE /api/sales/:id - Delete pending sales
// ==========================================
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!existingSale) {
        throw new Error("Sale not found.");
      }

      if (existingSale.status !== "Pending") {
        throw new Error("Only pending sales can be deleted.");
      }

      // Restore stock
      for (const item of existingSale.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      await tx.sale.delete({
        where: { id: existingSale.id },
      });
    });

    res.json({ success: true, message: "Sale deleted successfully." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// POST /api/sales/:id/cancel - Cancel sale and restore stock
// ==========================================
const cancelSale = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!existingSale) {
        throw new Error("Sale not found.");
      }

      if (existingSale.status === "Cancelled") {
        return existingSale;
      }

      // Restore stock
      for (const item of existingSale.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // Mark status as Cancelled
      const updated = await tx.sale.update({
        where: { id: existingSale.id },
        data: { status: "Cancelled" },
        include: { items: true },
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/sales/stats - Analytics stats
// ==========================================
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const allSalesAggregate = await prisma.sale.aggregate({
      where: { status: { not: "Cancelled" } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const totalRevenue = allSalesAggregate._sum.totalAmount || 0;
    const totalOrders = allSalesAggregate._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const currentMonthSales = await prisma.sale.aggregate({
      where: {
        status: { not: "Cancelled" },
        createdAt: { gte: startOfCurrentMonth },
      },
      _sum: { totalAmount: true },
    });
    const currentRevenue = currentMonthSales._sum.totalAmount || 0;

    const lastMonthSales = await prisma.sale.aggregate({
      where: {
        status: { not: "Cancelled" },
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: { totalAmount: true },
    });
    const lastRevenue = lastMonthSales._sum.totalAmount || 0;

    let revenueGrowthPercentage = 0;
    if (lastRevenue > 0) {
      revenueGrowthPercentage = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    } else if (currentRevenue > 0) {
      revenueGrowthPercentage = 100;
    }

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/sales/chart - Timeline revenue chart data
// ==========================================
const getChartData = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    let data = [];
    const now = new Date();

    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sales = await prisma.sale.findMany({
        where: {
          status: { not: "Cancelled" },
          createdAt: { gte: startOfDay },
        },
        orderBy: { createdAt: "asc" },
      });

      const hourMap = {};
      for (let i = 0; i < 24; i++) {
        const label = `${i.toString().padStart(2, "0")}:00`;
        hourMap[label] = 0;
      }
      sales.forEach((sale) => {
        const hr = new Date(sale.createdAt).getHours();
        const label = `${hr.toString().padStart(2, "0")}:00`;
        hourMap[label] += sale.totalAmount;
      });
      data = Object.keys(hourMap).map((label) => ({ label, value: hourMap[label] }));
    } else if (period === "weekly") {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);

      const sales = await prisma.sale.findMany({
        where: {
          status: { not: "Cancelled" },
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
      data = Object.keys(dayMap).map((label) => ({ label, value: dayMap[label] }));
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sales = await prisma.sale.findMany({
        where: {
          status: { not: "Cancelled" },
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
      data = Object.keys(dayMap).map((label) => ({ label: `Day ${label}`, value: dayMap[label] }));
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/sales/recent - Recent Sales Transactions
// ==========================================
const getRecentSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/sales/export/csv - Export all sales as CSV download
// ==========================================
const exportCSV = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    let csvContent = "Invoice Number,Customer Name,Customer Phone,Customer Email,Customer Address,Date,Payment Method,Status,Subtotal,Discount,Tax,Total Amount,Items Summary\n";
    sales.forEach((sale) => {
      const itemsSummary = sale.items.map((item) => `${item.medicine.name} (x${item.quantity})`).join("; ");
      const dateStr = new Date(sale.createdAt).toLocaleDateString();
      const escapedCustomer = sale.customerName.replace(/"/g, '""');
      const phone = sale.customer ? sale.customer.phone : "";
      const email = sale.customer?.email ? sale.customer.email.replace(/"/g, '""') : "";
      const address = sale.customer?.address ? sale.customer.address.replace(/"/g, '""') : "";
      
      csvContent += `"${sale.invoiceNumber}","${escapedCustomer}","${phone}","${email}","${address}","${dateStr}","${sale.paymentMethod}","${sale.status}",${sale.subtotal},${sale.discount},${sale.tax},${sale.totalAmount},"${itemsSummary}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sales_report.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  cancelSale,
  getStats,
  getChartData,
  getRecentSales,
  exportCSV,
};
