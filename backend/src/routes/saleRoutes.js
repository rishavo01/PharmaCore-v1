const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/saleController");

// Analytics and Utility Routes (must come before /:id)
router.get("/stats", getStats);
router.get("/chart", getChartData);
router.get("/recent", getRecentSales);
router.get("/export/csv", exportCSV);

// Standard CRUD Routes
router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.put("/:id", updateSale);
router.delete("/:id", deleteSale);
router.post("/:id/cancel", cancelSale);

module.exports = router;
