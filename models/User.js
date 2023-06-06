const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

const User = sequelize.define(
    "users",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [4],
            },
            //minimum length 4 characters
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
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

User.prototype.generateAuthToken = function () {
    const token = jwt.sign({ userId: this.id, nickName: this.nickName }, defaults.jwtKey);
    console.log("🚀 ~ file: user.js:55 ~ token:", token);
    return token;
};
module.exports = User;
