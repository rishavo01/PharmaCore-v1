const express = require("express");
const router = express.Router();
const {
  getSuppliers,
  getSupplierStats,
  getRegionalDistribution,
  getStockAlerts,
  exportSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

router.get("/", getSuppliers);
router.get("/stats", getSupplierStats);
router.get("/regions", getRegionalDistribution);
router.get("/stock-alerts", getStockAlerts);
router.get("/export", exportSuppliers);
router.get("/:id", getSupplierById);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
