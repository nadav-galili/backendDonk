const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const jwt = require("jsonwebtoken");

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "admin",
    timestamps: false,
  }
);

Admin.generateToken = function () {
  const token = jwt.sign({ id: this.id }, "secretKey", { expiresIn: "1h" });
  return token;
};

module.exports = Admin;
