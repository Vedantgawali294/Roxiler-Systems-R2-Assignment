const { Sequelize } = require("sequelize");
require("dotenv").config();

// Use SQLite for development (easier setup)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.db", // SQLite database file
  logging: false,
});

module.exports = sequelize;
