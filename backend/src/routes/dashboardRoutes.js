const express = require("express");
const router = express.Router();
const {
  getSummary,
  getRevenueAnalytics,
  getRecentActivity,
  getAlerts,
  exportDashboardData,
} = require("../controllers/dashboardController");

router.get("/summary", getSummary);
router.get("/revenue", getRevenueAnalytics);
router.get("/recent-activity", getRecentActivity);
router.get("/alerts", getAlerts);
router.get("/export", exportDashboardData);

module.exports = router;