const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");
const UserModel = require("../models/User");

exports.createUserGame = async (player, game, leagueId) => {
  return await UserGameModel.create({
    user_id: player.user_id,
    game_id: game.id,
    league_id: leagueId,
  });
};

exports.createGameDetails = async (player, game, leagueId) => {
  return await GameDetailsModel.create({
    game_id: game.id,
    league_id: leagueId,
    user_id: player.user_id,
  });
};

exports.getUserData = async (playerId) => {
  return await UserModel.findOne({
    where: { id: playerId },
    attributes: ["id", "nickName", "image"],
  });
};
