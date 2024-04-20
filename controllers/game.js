const GameModel = require("../models/Game");
const UserGameModel = require("../models/UserGame");
const GameDetailsModel = require("../models/GameDetails");
const UserModel = require("../models/User");
const Sequelize = require("sequelize");
const gameUtils = require("../utils/gameUtils");
// const User = require("../models/User");
const dayJs = require("dayjs");

exports.newGame = async (req, res) => {
  const { selectedPlayers, leagueId, gameAdminId } = req.body;

  if (!selectedPlayers || !leagueId || !gameAdminId)
    return res.status(400).json({ message: "missing data", data: req.body });

  try {
    const game = await GameModel.create({
      league_id: leagueId,
      isOpen: true,
      game_manager_id: gameAdminId,
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

        newUserGame.dataValues.User = user.dataValues;
        newGameDetails.dataValues.User = user.dataValues;

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

exports.removeLastBuyInToPlayer = async (req, res) => {
  const { gameId, playerId, leagueId } = req.body;
  console.log("removeLastBuyInToPlayer", req.body);

  try {
    const lastBuyIn = await GameDetailsModel.findOne({
      where: {
        game_id: gameId,
        user_id: playerId,
        league_id: leagueId,
      },
      order: [["id", "DESC"]],
    });

    if (!lastBuyIn) {
      return res.status(400).json({ message: "No buy-ins found" });
    }

    await Promise.all([
      lastBuyIn.destroy(),
      UserGameModel.update(
        {
          buy_ins_amount: Sequelize.literal(
            `buy_ins_amount - ${lastBuyIn.buy_in_amount}`
          ),
          buy_ins_number: Sequelize.literal(`buy_ins_number - 1`),
        },
        {
          where: {
            user_id: playerId,
            game_id: gameId,
          },
        }
      ),
    ]);

    return res.status(200).json([
      {
        message: `Last buy-in ${lastBuyIn.buy_in_amount} removed from player ${playerId} in game ${gameId}`,
      },
      lastBuyIn?.buy_in_amount,
    ]);
  } catch (error) {
    console.error("Error removing buy-in:", error);
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
  const { gameId, userGamesData, league } = req.body;
  const leagueId = league.id;
  const allPlayersCashedOut = userGamesData.every(
    (player) => player.is_cashed_out === true
  );
  if (!allPlayersCashedOut) {
    return res.status(400).json({ message: "not all players cashed out" });
  }
  try {
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

    // Step 1: Calculate total profit for each user in the league
    const getSeasonProfitForUsers = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("sum", Sequelize.col("profit")), "totalProfit"],
      ],
      where: { league_id: leagueId },
      group: "user_id",
      order: [[Sequelize.col("totalProfit"), "DESC"]],
      raw: true,
    });

    userGames.forEach((userGame) => {
      const user = getSeasonProfitForUsers.find(
        (user) => user.user_id === userGame.user_id
      );
      userGame.totalProfit = user.totalProfit;
    });

    // Step 2: Sort userGames by totalProfit in descending order
    userGames.sort((a, b) => b.totalProfit - a.totalProfit);

    // Step 3: Update game_rank based on the sorted order
    userGames.forEach((userGame, index) => {
      userGame.season_rank = index + 1;
    });

    await Promise.all(
      sortedUserGames.map(async (userGame) => {
        await UserGameModel.update(
          {
            game_rank: userGame.gameRank,
            season_rank: userGame.season_rank,
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
  } catch (error) {
    console.error("Error ending game:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

  res.status(200).json({ message: `Game ${gameId} ended` });
};

exports.getAllGames = async (req, res) => {
  const { leagueId, continuationToken, startDate, endDate } = req.query;
  let createdAt = startDate ?? dayJs().startOf("year").toDate();
  let endAt = endDate ?? dayJs().toDate();

  // Convert continuationToken to a number and provide a default value if it's not a valid number
  const offset = Number(continuationToken) || 0;

  if (isNaN(offset)) {
    console.error("Invalid continuation token:", continuationToken);
    return res.status(400).json({ error: "Invalid pagination token" });
  }

  try {
    const limit = 3; // Number of games per page

    const games = await GameModel.findAll({
      where: {
        league_id: leagueId,
        created_at: {
          [Sequelize.Op.between]: [createdAt, endAt],
        },
      },
      attributes: [
        "id",
        "created_at",
        "updated_at",
        "isOpen",
        "game_manager_id",
      ],
      include: [
        {
          model: UserGameModel,
          as: "userGames",
          attributes: [
            "game_id",
            "profit",
            "user_id",
            "buy_ins_amount",
            "cash_in_hand",
            "game_rank",
          ],
          include: [
            {
              model: UserModel,
              as: "User",
              attributes: ["id", "nickName", "image"],
            },
          ],
        },
      ],
      order: [
        ["id", "DESC"], // This orders the Games by id in descending order
        [{ model: UserGameModel, as: "userGames" }, "game_rank", "ASC"], // This orders the nested UserGames by game_rank in ascending order
      ],
      limit,
      offset,
    });

    const nextContinuationToken = offset + limit;
    if (games.length > 0) {
      const game_manager = await UserModel.findOne({
        where: {
          id: games[0]?.game_manager_id,
        },
        attributes: ["id", "nickName", "image"],
      });
      games.forEach((game) => {
        game.dataValues.game_manager = game_manager;
      });
    }

    res.status(200).json({
      games,
      nextContinuationToken: nextContinuationToken,
    });
  } catch (error) {
    console.error("Error getting all games:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error });
  }
};
exports.checkIfOpenGameExist = async (req, res) => {
  const { leagueId } = req.query;

  const openGame = await GameModel.findOne({
    where: {
      league_id: leagueId,
      isOpen: true,
    },
  });
  if (!openGame)
    return res.status(404).json({ message: "No open games found" });
  const userGames = await UserGameModel.findAll({
    where: {
      game_id: openGame?.id,
    },
    include: [
      {
        model: UserModel,
        as: "User",
        attributes: ["id", "nickName", "image"],
      },
    ],
  });
  const gameDetails = await GameDetailsModel.findAll({
    where: {
      game_id: openGame?.id,
    },
  });

  return res.status(200).json({
    message: `Game number ${openGame.id} already open `,
    game: openGame,
    userGames,
    gameDetails,
  });
};
