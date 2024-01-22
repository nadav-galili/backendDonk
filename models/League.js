const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const League = sequelize.define(
  "League",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    league_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
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

async function generateLeagueNumber(League) {
  while (true) {
    let randomNumber = Math.floor(Math.random() * (99999 - 1000 + 1)) + 1000;
    let leagueNumber = randomNumber;
    let leagueWithNumber = await League.findOne({
      where: { league_number: leagueNumber },
    });
    if (!leagueWithNumber) {
      return leagueNumber;
    }
  }
}

module.exports = League;
module.exports.generateLeagueNumber = generateLeagueNumber;
