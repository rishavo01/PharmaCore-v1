const prisma = require("../config/prisma");

// =========================
// Get All Medicines
// =========================
const getMedicines = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany();

    res.json(medicines);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Search Medicines (Autocomplete)
// GET /api/medicines/search?q=para
// =========================
const searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 5,
    });

    res.json(medicines);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Get Single Medicine
// =========================
const getMedicineById = async (req, res) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json(medicine);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Create Medicine
// =========================
const createMedicine = async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      buyPrice,
      sellPrice,
      expiryDate,
    } = req.body;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        category,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        expiryDate: new Date(expiryDate),
      },
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Update Medicine
// =========================
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      category,
      quantity,
      buyPrice,
      sellPrice,
      expiryDate,
    } = req.body;

    const medicine = await prisma.medicine.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        category,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        expiryDate: new Date(expiryDate),
      },
    });

    res.json(medicine);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Delete Medicine
// =========================
const deleteMedicine = async (req, res) => {
  try {
    await prisma.medicine.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMedicines,
  searchMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};


