const UserModel = require("./User");
const LeagueModel = require("./League");
const UserLeagueModel = require("./UserLeague");
const GameModel = require("./Game");

// Define associations
UserModel.hasMany(UserLeagueModel, { foreignKey: "user_id", as: "userLeagues" });
UserLeagueModel.belongsTo(UserModel, { foreignKey: "user_id" });
LeagueModel.hasMany(UserLeagueModel, { foreignKey: "league_id", as: "userLeagues" });
UserLeagueModel.belongsTo(LeagueModel, { foreignKey: "league_id", as: "league" });
UserModel.belongsToMany(LeagueModel, { through: UserLeagueModel, as: "leagues", foreignKey: "user_id" });
LeagueModel.belongsToMany(UserModel, { through: UserLeagueModel, as: "users", foreignKey: "league_id" });

// Sync models
(async () => {
    try {
        await UserModel.sync({ force: false });
        await LeagueModel.sync({ force: false });
        await UserLeagueModel.sync({ force: false });
        await GameModel.sync({ force: false });
        console.log("Tables synchronized successfully");
    } catch (error) {
        console.error("Error synchronizing tables:", error);
    }
})();
