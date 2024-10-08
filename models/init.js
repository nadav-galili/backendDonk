const UserModel = require("./User");
const LeagueModel = require("./League");
const UserLeagueModel = require("./UserLeague");
const GameModel = require("./Game");
const UserGameModel = require("./UserGame");
const GameDetailsModel = require("./GameDetails");

// Define associations
UserModel.hasMany(UserLeagueModel, {
  foreignKey: "user_id",
  as: "userLeagues",
});
UserLeagueModel.belongsTo(UserModel, { foreignKey: "user_id" });

LeagueModel.hasMany(UserLeagueModel, {
  foreignKey: "league_id",
  as: "userLeagues",
});
UserLeagueModel.belongsTo(LeagueModel, {
  foreignKey: "league_id",
  as: "league",
});

UserModel.belongsToMany(LeagueModel, {
  through: UserLeagueModel,
  as: "leagues",
  foreignKey: "user_id",
});
LeagueModel.belongsToMany(UserModel, {
  through: UserLeagueModel,
  as: "users",
  foreignKey: "league_id",
});

LeagueModel.belongsTo(UserModel, { foreignKey: "admin_id", as: "admin" });

LeagueModel.hasMany(GameModel, { foreignKey: "league_id", as: "games" });
GameModel.belongsTo(LeagueModel, { foreignKey: "league_id", as: "league" });

GameModel.belongsToMany(UserModel, {
  through: UserGameModel,
  as: "users",
  foreignKey: "game_id",
});
UserModel.belongsToMany(GameModel, {
  through: UserGameModel,
  as: "games",
  foreignKey: "user_id",
});

UserGameModel.belongsTo(UserModel, { foreignKey: "user_id" });
UserGameModel.belongsTo(GameModel, { foreignKey: "game_id" });
UserGameModel.belongsTo(LeagueModel, { foreignKey: "league_id" });

GameModel.hasMany(UserGameModel, { foreignKey: "game_id", as: "user_games" });

UserModel.hasMany(GameDetailsModel, {
  foreignKey: "user_id",
  as: "userGamesDetails",
});
GameDetailsModel.belongsTo(UserModel, { foreignKey: "user_id" });
GameDetailsModel.belongsTo(GameModel, { foreignKey: "game_id" });
GameDetailsModel.belongsTo(LeagueModel, { foreignKey: "league_id" });

GameModel.hasMany(GameDetailsModel, {
  foreignKey: "game_id",
  as: "gameDetails",
});
LeagueModel.hasMany(GameDetailsModel, {
  foreignKey: "league_id",
  as: "leagueGamesDetails",
});

// GameModel.belongsTo(UserModel, { foreignKey: "game_manager_id" });
GameModel.belongsTo(UserModel, {
  as: "game_manager",
  foreignKey: "game_manager_id",
});

// Sync models
(async () => {
  try {
    await UserModel.sync({ force: false });
    await LeagueModel.sync({ force: false });
    await UserLeagueModel.sync({ force: false });
    await GameModel.sync({ force: false });
    await UserGameModel.sync({ force: false });
    await GameDetailsModel.sync({ force: false });
    console.log("Tables synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing tables:", error);
  }
})();
