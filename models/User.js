const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

class User extends Model {
    generateAuthToken() {
        const token = jwt.sign({ userId: this.id, nickName: this.nickName }, defaults.jwtKey);
        console.log("🚀 ~ file: user.js:55 ~ token:", token);
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
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [4],
            },
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
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = User;
