const init = require("../models/init");
// const User = require("../models/user");
// const League = require("../models/league");
const UserModel = require("../models/User");
const UserLeagueModel = require("../models/UserLeague");
const LeagueModel = require("../models/League");
const GameModel = require("../models/Game");
const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");

exports.newGame = async (req, res) => {
    // console.log("🚀 ~ file: game.js:10 ~ exports.newGame= ~ req:", req.body);
    const { selectedPlayers, selectedLeague, leaguePlayers } = req.body;
    console.log("🚀 ~ file: game.js:11 ~ exports.newGame= ~ leaguePlayers:", leaguePlayers);
    console.log("🚀 ~ file: game.js:12 ~ exports.newGame= ~ selectedLeague:", selectedLeague[0]);
    console.log("🚀 ~ file: game.js:13 ~ exports.newGame= ~ selectedPlayers:", selectedPlayers);

    try {
        const game = await GameModel.create({
            league_id: selectedLeague[0]?.league_id,
            isOpen: true,
        });

        const usersGame = [];
        const usersGameDetails = [];

        await Promise.all(
            selectedPlayers.map(async (player) => {
                const userGame = await UserGameModel.create({
                    user_id: player,
                    game_id: game.id,
                    league_id: selectedLeague[0]?.league_id,
                });
                usersGame.push(userGame);

                const gameDetails = await GameDetailsModel.create({
                    game_id: game.id,
                    league_id: selectedLeague[0]?.league_id,
                    user_id: player,
                });
                usersGameDetails.push(gameDetails);
            })
        );

        console.log("🚀 ~ file: game.js:24 ~ exports.newGame= ~ usersGame:", usersGame);

        return res.status(200).json({ message: `Game number ${game.id} created`, game, usersGame, usersGameDetails });
    } catch (error) {
        console.error("Error creating game:", error);
    }
};
