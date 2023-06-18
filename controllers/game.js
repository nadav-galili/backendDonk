const init = require("../models/init");
// const User = require("../models/user");
// const League = require("../models/league");
const UserModel = require("../models/User");
const UserLeagueModel = require("../models/UserLeague");
const LeagueModel = require("../models/League");
const GameModel = require("../models/Game");

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
        console.log("🚀 ~ file: game.js:19 ~ exports.newGame= ~ game:", game);
    } catch (error) {
        console.error("Error creating game:", error);
    }
};
