const GameModel = require("../models/Game");
const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");
const UserModel = require("../models/User");
const Sequelize = require("sequelize");

exports.newGame = async (req, res) => {
    const { selectedPlayers, selectedLeague } = req.body;

    try {
        const game = await GameModel.create({
            league_id: selectedLeague[0]?.league_id,
            isOpen: true,
        });

        // const usersGames = [];
        const GameDetails = [];

        await Promise.all(
            selectedPlayers.map(async (player) => {
                const userGame = await UserGameModel.create({
                    user_id: player,
                    game_id: game.id,
                    league_id: selectedLeague[0]?.league_id,
                });

                //get users data for userGame
                // const userGameUser = await UserGameModel.findOne({
                //     where: {
                //         user_id: player,
                //         game_id: game.id,
                //     },
                //     include: [
                //         {
                //             model: UserModel,
                //             as: "User",
                //             attributes: ["id", "nickName", "image"],
                //         },
                //     ],
                // });

                // usersGames.push(userGameUser);

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
        return res.status(200).json({ message: `Game number ${game.id} created`, game, GameDetails });
    } catch (error) {
        console.error("Error creating game:", error);
    }
};

exports.addBuyInToPlayer = async (req, res) => {
    const { gameId, playerId, buyInAmount, leagueId } = req.body;
    const addBuyIn = await GameDetailsModel.create({
        buy_in_amount: buyInAmount,
        game_id: gameId,
        user_id: playerId,
        league_id: leagueId,
    });

    const userGamesUpdate = await UserGameModel.update(
        {
            buy_ins_amount: Sequelize.literal(`buy_ins_amount + 100`),
            buy_ins_number: Sequelize.literal(`buy_ins_number + 1`),
        },

        {
            where: {
                user_id: playerId,
                game_id: gameId,
            },
        }
    );

    const gameUpdate = await GameModel.update(
        {
            isOpen: 1,
        },

        {
            where: {
                id: gameId,
            },
        }
    );
    return res.status(200).json({ message: `Buy in added to player ${playerId} in game ${gameId}` });
};

exports.getUserGamesByGameId = async (req, res) => {
    const { gameId } = req.params;

    const userGames = await UserGameModel.findAll({
        where: {
            game_id: gameId,
        },
        include: [
            {
                model: UserModel,
                as: "User",
                attributes: ["id", "nickName", "image"],
            },
        ],
    });

    return res.status(200).json({ userGames });
};

exports.getGameDetails = async (req, res) => {
    const { gameId } = req.params;

    const gameDetails = await GameDetailsModel.findAll({
        where: {
            game_id: gameId,

            buy_in_amount: {
                [Sequelize.Op.ne]: 0,
            },
        },
        include: [
            {
                model: UserModel,
                as: "User",
                attributes: ["id", "nickName", "image"],
            },
        ],
        order: [["id", "DESC"]],
    });
    // console.log("🚀 ~ file: game.js:141 ~ exports.getGameDetails= ~ gameDetails:", gameDetails);

    return res.status(200).json({ gameDetails });
};
