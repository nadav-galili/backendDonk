const GameModel = require("../models/Game");
const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");
const UserModel = require("../models/User");
// const LeagueModel = require("../models/League");
const Sequelize = require("sequelize");
const gameUtils = require("../utils/gameUtils");

exports.newGame = async (req, res) => {
  const { selectedPlayers, leagueId } = req.body;

  if (!selectedPlayers || !leagueId)
    return res.status(400).json({ message: "missing data" });

  try {
    const game = await GameModel.create({
      league_id: leagueId,
      isOpen: true,
    });

    const gameDetails = [];
    const userGames = [];

    await Promise.all(
      selectedPlayers.map(async (player) => {
        const newUserGame = await gameUtils.createUserGame(
          player,
          game,
          leagueId
        );
        const newGameDetails = await gameUtils.createGameDetails(
          player,
          game,
          leagueId
        );

        const user = await gameUtils.getUserData(player.user_id);

        newUserGame.dataValues.user = user.dataValues;
        newGameDetails.dataValues.user = user.dataValues;

        userGames.push(newUserGame);
        gameDetails.push(newGameDetails);
      })
    );

    return res.status(200).json({
      message: `Game number ${game.id} created`,
      game,
      userGames,
      gameDetails,
    });
  } catch (error) {
    console.error("Error creating game:", error);
  }
};
exports.addBuyInToPlayer = async (req, res) => {
  const { gameId, playerId, buyInAmount, leagueId } = req.body;
  console.log("🚀 ~ exports.addBuyInToPlayer= ~ playerId:", playerId);
  console.log("ww", typeof buyInAmount, buyInAmount);

  try {
    await Promise.all([
      GameDetailsModel.create({
        buy_in_amount: buyInAmount,
        game_id: gameId,
        user_id: playerId,
        league_id: leagueId,
      }),
      UserGameModel.update(
        {
          buy_ins_amount: Sequelize.literal(`buy_ins_amount + ${buyInAmount}`),
          buy_ins_number: Sequelize.literal(`buy_ins_number + 1`),
        },
        {
          where: {
            user_id: playerId,
            game_id: gameId,
          },
        }
      ),
      GameModel.update(
        {
          isOpen: 1,
        },
        {
          where: {
            id: gameId,
          },
        }
      ),
    ]);

    return res.status(200).json({
      message: `Buy in added to player ${playerId} in game ${gameId}`,
    });
  } catch (error) {
    console.error("Error adding buy-in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
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

  return res.status(200).json({ gameDetails });
};

exports.cashOutPlayer = async (req, res) => {
  const { userId, gameId, cashOutAmount } = req.body;
  console.log("cashOutPlayer", req.body);

  await UserGameModel.update(
    {
      cash_in_hand: cashOutAmount,
      profit: Sequelize.literal(`${cashOutAmount}-buy_ins_amount `),
      is_cashed_out: true,
      cash_out_time: new Date(),
    },

    {
      where: {
        user_id: userId,
        game_id: gameId,
      },
    }
  );

  const updatedUser = await UserModel.findOne({
    where: {
      id: userId,
    },
    attributes: ["nickName"],
  });

  res.status(200).json({
    message: `Player ${updatedUser.nickName} cashed out ${cashOutAmount} in game ${gameId}`,
  });
};

exports.endGame = async (req, res) => {
  const { gameId, userGamesData } = req.body;
  const allPlayersCashedOut = userGamesData.every(
    (player) => player.is_cashed_out === true
  );
  if (!allPlayersCashedOut) {
    return res.status(400).json({ message: "not all players cashed out" });
  }

  await GameModel.update(
    {
      isOpen: 0,
    },
    {
      where: {
        id: gameId,
      },
    }
  );

  const userGames = await UserGameModel.findAll({
    where: {
      game_id: gameId,
    },
  });

  const sortedUserGames = userGames.sort((a, b) => b.profit - a.profit);
  sortedUserGames.forEach((userGame, index) => {
    userGame.gameRank = index + 1;
  });

  await Promise.all(
    sortedUserGames.map(async (userGame) => {
      await UserGameModel.update(
        {
          game_rank: userGame.gameRank,
        },
        {
          where: {
            user_id: userGame.user_id,
            game_id: gameId,
          },
        }
      );
    })
  );

  res.status(200).json({ message: `Game ${gameId} ended` });
};
