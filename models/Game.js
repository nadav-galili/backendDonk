const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Games = sequelize.define(
    "Games",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        league_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        isOpen: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: "Games",
        tableName: "Games",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Games;
