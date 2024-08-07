const { Model, DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

class User extends Model {
  generateAuthToken() {
    const token = jwt.sign(
      { userId: this.id, nickName: this.nickName },
      process.env.JWTKEY
    );
    return token;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      index: true,
      validate: {
        len: [2],
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expoPushToken:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;
