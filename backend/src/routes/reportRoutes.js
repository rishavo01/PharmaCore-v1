const express = require("express");
const router = express.Router();
const {
  getSummary,
  getChart,
  getCategories,
  getTopMedicines,
  exportReport,
} = require("../controllers/reportController");

router.get("/summary", getSummary);
router.get("/chart", getChart);
router.get("/categories", getCategories);
router.get("/top-medicines", getTopMedicines);
router.get("/export", exportReport);

module.exports = router;
