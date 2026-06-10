const prisma = require("../config/prisma");

const getStats = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany();
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    res.json({
      totalMedicines: medicines.length,
      totalMedsDelta: 0,
      lowStock: medicines.filter(m => m.quantity <= 20).length,
      expiredSoon: medicines.filter(m => m.expiryDate && new Date(m.expiryDate) <= soon).length,
      totalSales: 0,
      todaySalesDelta: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRevenue = async (req, res) => {
  try {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const todayIndex = new Date().getDay();
    const data = days.map((day, i) => ({
      day,
      value: 0,
      isToday: i === todayIndex,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStockMetrics = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany();
    const total = medicines.length;

    if (total === 0) {
      return res.json({
        stockOptimization: 0,
        fulfillmentRate: 0,
        fulfillmentCleared: 0,
        fulfillmentTotal: 0,
      });
    }

    const wellStocked = medicines.filter(m => m.quantity > 20).length;
    const stockOptimization = Math.round((wellStocked / total) * 100);

    res.json({
      stockOptimization,
      fulfillmentRate: 0,
      fulfillmentCleared: 0,
      fulfillmentTotal: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    // Update this when you have a Sales/Billing table
    res.json([]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPriorityAlerts = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany();
    const alerts = [];
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    medicines.forEach(m => {
      if (m.quantity <= 20) {
        alerts.push({
          id: `low-${m.id}`,
          name: m.name,
          detail: `Stock critical: ${m.quantity} units`,
          type: 'Order',
        });
      }
      if (m.expiryDate && new Date(m.expiryDate) <= soon) {
        alerts.push({
          id: `exp-${m.id}`,
          name: m.name,
          detail: `Expires ${new Date(m.expiryDate).toLocaleDateString()}`,
          type: 'Disposal',
        });
      }
    });

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getRevenue,
  getStockMetrics,
  getRecentTransactions,
  getPriorityAlerts,
};