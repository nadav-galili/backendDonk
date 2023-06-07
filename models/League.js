const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const League = sequelize.define(
    "leagues",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        league_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        league_image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = League;
