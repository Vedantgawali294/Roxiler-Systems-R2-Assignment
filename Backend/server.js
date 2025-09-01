const express = require("express");
const cors = require("cors");
const sequelize = require("./db"); // DB connection

// Import models to register them with Sequelize
require("./models/User");
require("./models/Store");
require("./models/Rating");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));
app.use("/api/owner", require("./routes/owner"));

// Test route
app.get("/", (req, res) => {
  res.send("API Running");
});

// Sync Database - creates tables if they don't exist
sequelize.sync({ alter: true })
  .then(() => console.log("✅ Database connected and synced"))
  .catch(err => console.log("❌ Error: " + err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
