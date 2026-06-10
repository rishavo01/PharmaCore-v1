const express = require("express");
const router = express.Router();

const {
  getMedicines,
  searchMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");

// Debug
console.log({
  getMedicines,
  searchMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
});

// Routes
router.get("/", getMedicines);

// IMPORTANT: Place this before "/:id"
router.get("/search", searchMedicines);

router.get("/:id", getMedicineById);

router.post("/", createMedicine);

router.put("/:id", updateMedicine);

router.delete("/:id", deleteMedicine);

module.exports = router;


