const express = require("express");
const cors = require("cors");
require("dotenv").config();

const medicineRoutes = require("./routes/medicineRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PharmaCore API Running");
});

app.use("/api/medicines", medicineRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});