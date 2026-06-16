const prisma = require("../config/prisma");

// ==========================================
// GET /api/customers/phone/:phone - Lookup customer by phone number
// ==========================================
const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (customer) {
      return res.json({ exists: true, customer });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/customers/:id - Get customer details
// ==========================================
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// POST /api/customers - Create new customer
// ==========================================
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and Phone Number are required." });
    }

    // Check unique constraint manually for cleaner error responses
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Phone number must be unique. Customer already exists." });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUT /api/customers/:id - Update customer
// ==========================================
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and Phone Number are required." });
    }

    // Check if phone number is already occupied by another customer
    const conflict = await prisma.customer.findFirst({
      where: {
        phone,
        id: { not: parseInt(id) },
      },
    });
    if (conflict) {
      return res.status(400).json({ success: false, message: "Phone number already occupied by another customer." });
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
      },
    });

    res.json(customer);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET /api/customers/search - Search matching customers by phone
// ==========================================
const searchCustomers = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.json([]);
    }

    const customers = await prisma.customer.findMany({
      where: {
        phone: {
          contains: phone,
        },
      },
      take: 10,
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomerByPhone,
  getCustomerById,
  createCustomer,
  updateCustomer,
  searchCustomers,
};

