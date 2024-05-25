const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const UserGames = sequelize.define(
  "UserGames",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    buy_ins_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    buy_ins_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cash_in_hand: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    profit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_cashed_out: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cash_out_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    game_rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    season_rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    league_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "UserGames",
    tableName: "user_games",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = UserGames;
