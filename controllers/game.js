const GameModel = require("../models/Game");
const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");
const UserModel = require("../models/User");

exports.newGame = async (req, res) => {
    const { selectedPlayers, selectedLeague } = req.body;

    try {
        const game = await GameModel.create({
            league_id: selectedLeague[0]?.league_id,
            isOpen: true,
        });

        const usersGames = [];
        const GameDetails = [];

        await Promise.all(
            selectedPlayers.map(async (player) => {
                const userGame = await UserGameModel.create({
                    user_id: player,
                    game_id: game.id,
                    league_id: selectedLeague[0]?.league_id,
                });

                //get users data for userGame
                const userGameUser = await UserGameModel.findOne({
                    where: {
                        user_id: player,
                        game_id: game.id,
                    },
                    // attributes: ["id", "user_id", "game_id", "league_id"],
                    include: [
                        {
                            model: UserModel,
                            as: "User",
                            attributes: ["id", "nickName", "image"],
                        },
                    ],
                });

                usersGames.push(userGameUser);

                const newGameDetails = await GameDetailsModel.create({
                    game_id: game.id,
                    league_id: selectedLeague[0]?.league_id,
                    user_id: player,
                });

                //get users data for game details
                const user = await UserGameModel.findOne({
                    where: {
                        user_id: player,
                        game_id: game.id,
                    },
                    attributes: ["id", "user_id", "game_id", "league_id"],
                    include: [
                        {
                            model: UserModel,
                            as: "User",
                            attributes: ["id", "nickName", "image"],
                        },
                    ],
                });

                newGameDetails.dataValues.user = user?.dataValues?.User?.dataValues;

                GameDetails.push(newGameDetails);
            })
        );
        return res.status(200).json({ message: `Game number ${game.id} created`, game, usersGames, GameDetails });
    } catch (error) {
        console.error("Error creating game:", error);
    }
};
