const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define("users", {
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
});

module.exports = User;
