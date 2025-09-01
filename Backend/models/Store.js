const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Store = sequelize.define("Store", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  address: { type: DataTypes.STRING },
});

Store.belongsTo(User, { foreignKey: "owner_id" });

module.exports = Store;
