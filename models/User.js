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
    google_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      unique: true,
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    given_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    family_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expoPushToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
