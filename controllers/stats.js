const init = require("../models/init");
const UserModel = require("../models/User");
const GameDetailsModel = require("../models/GameDetails");
const GameModel = require("../models/Game");
const { Sequelize } = require("sequelize");
const UserGameModel = require("../models/UserGame");
const dayjs = require("dayjs");
const { sequelize } = require("../db");
const {
  calculateUserStreaks,
  noGamesLeagueObject,
  noGamesTotalProfitCard,
} = require("../utils/statsUtils");

exports.profitPerHour = async (req, res) => {
  const leagueId = req.params.leagueId;
  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noLeagueGames = await noGamesTotalProfitCard(leagueId);
      res.status(200).json(noLeagueGames);
      return;
    }
    const profitPerHour = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("SUM", Sequelize.col("profit")), "totalProfit"],
        [
          Sequelize.literal(
            "SUM(TIMESTAMPDIFF(MINUTE, UserGames.created_at, UserGames.cash_out_time))/60"
          ),
          "totalHours",
        ],
        [Sequelize.literal("SUM(buy_ins_amount)"), "totalBuyIns"],
      ],
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      group: ["user_id"],
    });

    // Calculate buyInPerHour based on totalBuyIns and totalHours
    profitPerHour.forEach((player) => {
      const totalHours = parseFloat(player.dataValues.totalHours);
      const totalBuyIns = parseFloat(player.dataValues.totalBuyIns);

      player.dataValues.buyInPerHour =
        totalHours !== 0 ? (totalBuyIns / totalHours).toFixed(2) : "N/A";
    });

    if (!profitPerHour.length) {
      res.status(404).json("No data found");
      return;
    }

    const formattedProftPerHour = profitPerHour.map((player) => {
      const id = player.user_id;
      const nickName = player["User"].nickName;
      const image = player["User"].image;
      let title =
        player.dataValues.totalHours !== 0
          ? (
              player.dataValues.totalProfit / player.dataValues.totalHours
            ).toFixed(2)
          : "N/A";
      const subTitle = Number(player.dataValues.totalHours).toFixed(2);
      const subTitle2 = player.dataValues.buyInPerHour;
      return {
        id,
        nickName,
        image,
        title,
        subTitle,
        subTitle2,
      };
    });

    res.status(200).json(formattedProftPerHour);
  } catch (error) {
    console.error("Error retrieving profit per hour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLeagueStats = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const sumResult = await GameDetailsModel.sum("buy_in_amount", {
      where: { league_id: leagueId },
    });

    const gamesCount = await GameModel.count({
      where: { league_id: leagueId },
    });
    // Calculate the average total buy-ins per game
    const avgTotalBuyInsPerGameForLeague = await sequelize.query(
      `
        SELECT 
          ROUND(AVG(total_buy_in),2) AS average_buy_in_per_game
        FROM 
          (
            SELECT 
              game_id, 
              SUM(buy_in_amount) AS total_buy_in
            FROM 
              gamedetails
            WHERE 
              league_id = ${leagueId}
            GROUP BY 
              game_id
          ) AS game_totals;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const games = await GameModel.findAll({
      attributes: [
        [
          Sequelize.fn(
            "TIMESTAMPDIFF",
            Sequelize.literal("MINUTE"),
            Sequelize.col("created_at"),
            Sequelize.col("updated_at")
          ),
          "durationInMinutes",
        ],
      ],
      where: { league_id: leagueId },
      raw: true,
    });

    const totalMinutes = games.reduce(
      (acc, game) => acc + game.durationInMinutes,
      0
    );
    const totalHours = totalMinutes / 60; // Convert minutes to hours

    let lastGame = await GameModel.findOne({
      where: { league_id: leagueId, isOpen: false },
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      limit: 1,
    });

    if (lastGame) {
      const formattedDate = dayjs(lastGame.created_at).format("DD/MM/YY");
      lastGame.dataValues.created_at = formattedDate;
    } else {
      // Handle case where no game is found
      lastGame = "No games found";
    }

    res.status(200).json({
      totalCashPlayed: sumResult,
      totalHours: totalHours.toFixed(2),
      gamesCount: gamesCount,
      lastGame: lastGame,
      avgTotalBuyInsPerGameForLeague:
        avgTotalBuyInsPerGameForLeague[0]?.average_buy_in_per_game,
    });
  } catch (error) {
    console.error("Error calculating sum:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPlayersStats = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const playersStats = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [
          Sequelize.fn("sum", Sequelize.col("buy_ins_number")),
          "totalBuyInsNumber",
        ],
        [Sequelize.fn("sum", Sequelize.col("cash_in_hand")), "totalCashInHand"],
        [Sequelize.fn("sum", Sequelize.col("profit")), "totalProfit"],
        [Sequelize.fn("avg", Sequelize.col("game_rank")), "averageGameRank"],
      ],
      where: { league_id: leagueId },
      group: ["user_id"],
      order: [[Sequelize.literal("totalProfit"), "DESC"]],
      include: [
        {
          model: UserModel,
          attributes: { exclude: ["password", "updated_at"] },
        },
      ],
      raw: true,
    });

    const formattedStats = playersStats.map((stats) => {
      return {
        id: stats.user_id,
        totalBuyInsNumber: stats.totalBuyInsNumber,
        totalCashInHand: stats.totalCashInHand,
        totalProfit: stats.totalProfit,
        averageGameRank: stats.averageGameRank,
        nickName: stats["User.nickName"],
        image: stats["User.image"],
        created_at: stats["User.created_at"],
      };
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error("Error retrieving players stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMainCardsStats = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noLeagueGames = await noGamesLeagueObject(leagueId);
      res.status(200).json(noLeagueGames);
      return;
    }
    const highestProfitPlayer = await UserGameModel.findOne({
      attributes: [
        "user_id",
        [Sequelize.fn("sum", Sequelize.col("profit")), "titleValue"],
        [Sequelize.fn("avg", Sequelize.col("profit")), "subTitle2Value"],
      ],
      where: { league_id: leagueId },
      group: ["user_id"],
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      order: [[Sequelize.literal("titleValue"), "DESC"]],
      raw: true,
    });

    /// get count of games for this user
    const gamesCount = await UserGameModel.count({
      where: { league_id: leagueId, user_id: highestProfitPlayer.user_id },
    });
    //add gamesCount to highestProfitPlayer object

    highestProfitPlayer.subTitleValue = gamesCount;
    const formattedStats = {
      id: highestProfitPlayer.user_id,
      titleValue: highestProfitPlayer.titleValue,
      subTitleValue: highestProfitPlayer.subTitleValue,
      subTitle2Value: parseInt(highestProfitPlayer.subTitle2Value).toFixed(2),
      nickName: highestProfitPlayer["User.nickName"],
      image: highestProfitPlayer["User.image"],
    };
    //************************** */
    const maxProfit = await UserGameModel.findOne({
      attributes: [
        [Sequelize.fn("max", Sequelize.col("profit")), "titleValue"],
        [Sequelize.col("buy_ins_amount"), "subTitleValue"],
        [Sequelize.col("UserGames.created_at"), "subTitle2Value"],
      ],
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      group: ["user_id", "buy_ins_amount", "UserGames.created_at"], // Add the 'buy_ins_amount' column to the GROUP BY clause
      order: [[Sequelize.literal("titleValue"), "DESC"]],
      raw: true,
    });
    const formattedDate = dayjs(maxProfit?.subTitle2Value).format("DD/MM/YY");
    maxProfit.subTitle2Value = formattedDate;
    maxProfit.nickName = maxProfit["User.nickName"];
    maxProfit.image = maxProfit["User.image"];
    delete maxProfit["User.nickName"];
    delete maxProfit["User.image"];
    //********************** */
    const highestProfitPerHourPlayer = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("SUM", Sequelize.col("profit")), "totalProfit"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "TIMESTAMPDIFF(MINUTE, UserGames.created_at, UserGames.updated_at)"
            )
          ),
          "totalHours",
        ],
      ],
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      group: ["user_id"],
    });

    let formattedHighestProfitPerHour = highestProfitPerHourPlayer.map(
      (player) => {
        return {
          id: player.user_id,
          nickName: player.User.nickName,
          image: player.User.image,
          titleValue: Number(player.dataValues.totalProfit),
          subTitleValue: (player.dataValues.totalHours / 60).toFixed(2),
          subTitle2Value: (
            player.dataValues.totalProfit /
            (player.dataValues.totalHours / 60)
          ).toFixed(2),
        };
      }
    );
    //get the player with the highest subTitle2Value
    formattedHighestProfitPerHour = formattedHighestProfitPerHour.reduce(
      (acc, player) => {
        return acc.subTitle2Value > player.subTitle2Value ? acc : player;
      }
    );
    //*************************** */

    const getTopComeback = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("max", Sequelize.col("buy_ins_amount")), "buyIn"],
        [Sequelize.fn("max", Sequelize.col("profit")), "profit"],
        "created_at",
      ],
      where: { league_id: leagueId, profit: { [Sequelize.Op.gt]: 0 } },
      group: ["user_id", "created_at"],
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      order: [[Sequelize.literal("buyIn"), "DESC"]],
      raw: true,
      limit: 1,
    });

    const formattedBiggestComeback = {
      id: getTopComeback[0].user_id,
      nickName: getTopComeback[0]["User.nickName"],
      image: getTopComeback[0]["User.image"],
      titleValue: getTopComeback[0].profit,
      subTitleValue: getTopComeback[0].buyIn,
      subTitle2Value: dayjs(getTopComeback[0].created_at).format("DD/MM/YY"),
    };

    //*************************** */

    await sequelize.query("SET @user_id = 0, @streak = 0, @prev_profit = 0;", {
      type: sequelize.QueryTypes.RAW,
    });
    await sequelize.query(
      "SET @current_user = NULL, @current_streak = 0, @last_game_id = NULL;",
      { type: sequelize.QueryTypes.RAW }
    );

    const getBestWinningStreak = await sequelize.query(
      `
      SELECT user_id, MAX(streak) as max_streak FROM (
          SELECT 
              user_id,
              game_id,
              profit,
              @current_streak := IF(@current_user = user_id AND @last_game_id + 1 = game_id AND profit > 0, @current_streak + 1, 
                                    IF(profit > 0, 1, 0)) AS streak,
              @last_game_id := game_id,
              @current_user := user_id
          FROM 
              user_games
          WHERE 
              league_id = :leagueId AND profit > 0
          ORDER BY 
              user_id, game_id
      ) AS subquery
      WHERE profit > 0
      GROUP BY user_id
      ORDER BY max_streak DESC
      LIMIT 1;
    `,
      {
        replacements: { leagueId: leagueId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    let bestWinningStreakUser = {};
    if (getBestWinningStreak.length > 0) {
      bestWinningStreakUser = await UserModel.findOne({
        where: { id: getBestWinningStreak[0].user_id },
        attributes: ["nickName", "image"],
      });
      let user_id = getBestWinningStreak[0].user_id || null;
      await sequelize.query(
        "SET @current_user = NULL, @current_streak = 0, @last_game_id = NULL, @last_profit = NULL;",
        { type: sequelize.QueryTypes.RAW }
      );

      const currentWinStreak = await sequelize.query(
        `
        SELECT user_id, MAX(current_streak) AS current_streak FROM (
            SELECT 
                user_id,
                game_id,
                profit,
                IF(@current_user = user_id AND @last_game_id + 1 = game_id AND profit > 0, 
                   @current_streak := IF(profit > 0, @current_streak + 1, @current_streak),
                   @current_streak := IF(profit > 0, 1, 0)
                ) AS current_streak,
                @last_game_id := game_id,
                @last_profit := profit,
                @current_user := user_id
            FROM 
                user_games
            WHERE 
                user_id = :userId AND league_id = :leagueId AND profit > 0
            ORDER BY 
                user_id, game_id DESC
        ) AS sub
        GROUP BY user_id
        ORDER BY current_streak DESC
        LIMIT 1;
      `,

        {
          replacements: {
            userId: user_id,
            leagueId: leagueId,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const winns = await UserGameModel.count({
        where: {
          league_id: leagueId,
          user_id: user_id,
          profit: { [Sequelize.Op.gt]: 0 },
        },
      });
      const loss = await UserGameModel.count({
        where: {
          league_id: leagueId,
          user_id: user_id,
          profit: { [Sequelize.Op.lt]: 0 },
        },
      });
      const ratio = (winns / (winns + loss)) * 100;

      bestWinningStreakUser = {
        id: getBestWinningStreak[0].user_id,
        nickName: bestWinningStreakUser.nickName,
        image: bestWinningStreakUser.image,
        titleValue: getBestWinningStreak[0].max_streak,
        subTitleValue: currentWinStreak?.[0]?.current_streak || 0,
        subTitle2Value: ratio.toFixed(2),
      };
    }

    res.status(200).json([
      {
        id: 1,
        title: "Total Profit",
        apiRoute: "totalProfit",
        cardTitle: "Total Profit",
        subTitle: "Total Games",
        subTitle2: "Average Profit",
        values: formattedStats,
      },
      {
        id: 2,
        title: "Top 10 Profits",
        apiRoute: "top10Profits",
        cardTitle: "Profit",
        subTitle: "Buy In",
        subTitle2: "Date",
        values: maxProfit,
      },
      {
        id: 3,
        title: "Profit Per Hour",
        apiRoute: "profitPerHour",
        cardTitle: "Profit per hour",
        subTitle: "Hours Played",
        subTitle2: "Buy In Per Hour",
        values: formattedHighestProfitPerHour,
      },
      {
        id: 4,
        title: "Top 10 Comebacks",
        apiRoute: "top10Comebacks",
        cardTitle: "Profit",
        subTitle: "Buy In",
        subTitle2: "Date",
        values: formattedBiggestComeback,
      },
      {
        id: 5,
        title: "Winning Streak",
        apiRoute: "winningStreak",
        cardTitle: "Max Streak",
        subTitle: "Current Streak",
        subTitle2: "Win Rate %",
        values: bestWinningStreakUser,
      },
    ]);
  } catch (error) {
    console.error("Error retrieving main cards stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.totalProfitForCard = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noGamesProfit = await noGamesTotalProfitCard(leagueId);
      res.status(200).json(noGamesProfit);

      return;
    }

    const totalProfit = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("sum", Sequelize.col("profit")), "totalProfit"],
        ///get count of games for this user
        [Sequelize.fn("count", Sequelize.col("game_id")), "gamesCount"],
      ],
      where: { league_id: leagueId },
      group: ["user_id"],
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      order: [[Sequelize.literal("totalProfit"), "DESC"]],
      raw: true,
    });

    const getWinLossRatio = async (user_id) => {
      const winns = await UserGameModel.count({
        where: {
          league_id: leagueId,
          user_id: user_id,
          profit: { [Sequelize.Op.gt]: 0 },
        },
      });
      const loss = await UserGameModel.count({
        where: {
          league_id: leagueId,
          user_id: user_id,
          profit: { [Sequelize.Op.lt]: 0 },
        },
      });
      const ratio = (winns / (winns + loss)) * 100;
      return ratio.toFixed(2);
    };

    const formattedTotalProfit = await Promise.all(
      totalProfit.map(async (player) => {
        return {
          id: player.user_id,
          nickName: player["User.nickName"],
          image: player["User.image"],
          title: player.totalProfit,
          subTitle: player.gamesCount,
          subTitle2: await getWinLossRatio(player.user_id),
        };
      })
    );

    res.status(200).json(formattedTotalProfit);
  } catch (error) {
    console.error("Error retrieving total profit for card:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.top10ProfitsForCard = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noGamesProfit = await noGamesTotalProfitCard(leagueId);
      res.status(200).json(noGamesProfit);

      return;
    }

    const top10Profits = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("sum", Sequelize.col("profit")), "totalProfit"],
        [Sequelize.fn("max", Sequelize.col("buy_ins_amount")), "buyInAmount"],
        [Sequelize.col("UserGames.created_at"), "gameDate"],
      ],
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      group: ["user_id", "buy_ins_amount", "UserGames.created_at"], // Add the 'buy_ins_amount' column to the GROUP BY clause
      order: [[Sequelize.literal("totalProfit"), "DESC"]],
      limit: 10,
      raw: true,
    });

    if (!top10Profits.length) {
      res.status(404).json("No data found");
      return;
    }

    const formattedTop10Profits = top10Profits.map((player) => {
      const formattedDate = dayjs(player.gameDate).format("DD/MM/YY");

      const id = player.user_id;
      const nickName = player["User.nickName"];
      const image = player["User.image"];
      const title = Number(player.totalProfit);
      const subTitle = player.buyInAmount;
      const subTitle2 = formattedDate;
      return {
        id,
        nickName,
        image,
        title,
        subTitle,
        subTitle2,
      };
    });

    res.status(200).json(formattedTop10Profits);
  } catch (error) {
    console.error("Error retrieving top 10 profits for card:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.top10Comebacks = async (req, res) => {
  //get the top 10 biggest comebacks:
  // players who had the biggest buy in amount and profit was > 0
  const leagueId = req.params.leagueId;

  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noGamesProfit = await noGamesTotalProfitCard(leagueId);
      res.status(200).json(noGamesProfit);

      return;
    }
    const top10Comebacks = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("max", Sequelize.col("buy_ins_amount")), "buyIn"],
        [Sequelize.fn("max", Sequelize.col("profit")), "profit"],
        "created_at",
      ],
      where: { league_id: leagueId, profit: { [Sequelize.Op.gt]: 0 } },
      group: ["user_id", "created_at"],
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      order: [[Sequelize.literal("buyIn"), "DESC"]],
      limit: 10,
      raw: true,
    });

    if (!top10Comebacks.length) {
      res.status(404).json("No data found");
      return;
    }

    const formattedTop10Comebacks = top10Comebacks.map((player) => {
      const formattedDate = dayjs(player.created_at).format("DD/MM/YY");

      const id = player.user_id;
      const nickName = player["User.nickName"];
      const image = player["User.image"];
      const title = Number(player.profit);
      const subTitle = player.buyIn;
      const subTitle2 = formattedDate;
      return {
        id,
        nickName,
        image,
        title,
        subTitle,
        subTitle2,
      };
    });

    res.status(200).json(formattedTop10Comebacks);
  } catch (error) {
    console.error("Error retrieving top 10 comebacks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// exports.winningStreak = async (req, res) => {
//   const leagueId = req.params.leagueId;

//   try {
//     const games = await UserGameModel.findAll({
//       attributes: ["user_id", "game_id", "profit", "created_at"],
//       where: { league_id: leagueId, profit: { [Sequelize.Op.gt]: 0 } },
//       order: ["user_id", "game_id"],
//       include: [
//         {
//           model: UserModel,
//           attributes: ["id", "image", "nickName"],
//         },
//       ],
//     });

//     let streaks = calculateStreaks(games);

//     streaks = await Promise.all(
//       streaks.map(async (player) => {
//         const ratio = await calculateWinnLossRatio(player.id, leagueId);
//         return {
//           ...player,
//           subTitle2: ratio,
//         };
//       })
//     );

//     streaks.sort((a, b) => b.title.localeCompare(a.title));

//     ///get
//     res.status(200).json(streaks);
//   } catch (error) {
//     console.error("Error calculating streaks:", error);
//     res.status(500).send("Error calculating streaks");
//   }
// };

exports.winningStreak = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const countGamesForLeague = await GameModel.count({
      where: { league_id: leagueId },
    });

    if (countGamesForLeague === 0) {
      const noGamesProfit = await noGamesTotalProfitCard(leagueId);
      res.status(200).json(noGamesProfit);

      return;
    }
    const games = await UserGameModel.findAll({
      attributes: [
        "user_id",
        "game_id",
        [Sequelize.fn("SUM", Sequelize.col("profit")), "total_profit"],
      ],
      where: { league_id: leagueId },
      group: ["user_id", "game_id"],
      order: ["user_id", "game_id"],
      include: [
        {
          model: UserModel,
          attributes: ["id", "image", "nickName"],
        },
      ],
    });
    const results = calculateUserStreaks(games);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating new winning streak:", error);
    res.status(500).send("Error calculating new winning streak");
  }
};

exports.getGlobalLeaderBoard = async (req, res) => {
  try {
    const leaderBoard = await UserGameModel.findAll({
      attributes: [
        "user_id",
        [Sequelize.fn("sum", Sequelize.col("profit")), "totalProfit"],
      ],
      group: ["user_id"],
      having: Sequelize.where(Sequelize.fn("sum", Sequelize.col("profit")), {
        [Sequelize.Op.gt]: 0,
      }),
      order: [[Sequelize.literal("totalProfit"), "DESC"]],
      limit: 10,
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      raw: true,
    });

    const formattedLeaderBoard = leaderBoard.map((player) => {
      return {
        user_id: player.user_id,
        totalProfit: Number(player.totalProfit),
        nickName: player["User.nickName"],
        image: player["User.image"],
      };
    });

    return res.status(200).json(formattedLeaderBoard);
  } catch (error) {
    console.error("Error retrieving global leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
