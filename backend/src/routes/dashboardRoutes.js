const express = require("express");
const router = express.Router();

const {
  getStats,
  getRevenue,
  getStockMetrics,
  getRecentTransactions,
  getPriorityAlerts,
} = require("../controllers/dashboardController");

router.get("/stats", getStats);
router.get("/revenue", getRevenue);
router.get("/stock-metrics", getStockMetrics);
router.get("/recent-transactions", getRecentTransactions);
router.get("/priority-alerts", getPriorityAlerts);

module.exports = router;