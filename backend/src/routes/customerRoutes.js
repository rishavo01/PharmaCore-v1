const express = require("express");
const router = express.Router();
const {
  getCustomerByPhone,
  getCustomerById,
  createCustomer,
  updateCustomer,
  searchCustomers,
} = require("../controllers/customerController");

router.get("/phone/:phone", getCustomerByPhone);
router.get("/search", searchCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);

module.exports = router;
