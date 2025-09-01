const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");
const Store = require("./Store");

const Rating = sequelize.define("Rating", {
  rating: { type: DataTypes.INTEGER, allowNull: false },
});

User.hasMany(Rating, { foreignKey: "user_id" });
Store.hasMany(Rating, { foreignKey: "store_id" });
Rating.belongsTo(User, { foreignKey: "user_id" });
Rating.belongsTo(Store, { foreignKey: "store_id" });

module.exports = Rating;
