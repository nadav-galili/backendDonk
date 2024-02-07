const init = require("../models/init");
const UserModel = require("../models/User");
const UserLeagueModel = require("../models/UserLeague");
const LeagueModel = require("../models/League");
const GameDetailsModel = require("../models/GameDetails");
const GameModel = require("../models/Game");
const { Sequelize } = require("sequelize");
const { format } = require("date-fns");
const UserGameModel = require("../models/UserGame");

exports.getLeagueStats = async (req, res) => {
  const leagueId = req.params.leagueId;

  try {
    const sumResult = await GameDetailsModel.sum("buy_in_amount", {
      where: { league_id: leagueId },
    });

    const gamesCount = await GameModel.count({
      where: { league_id: leagueId },
    });

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
      const formattedDate = format(new Date(lastGame.created_at), "dd/MM/yy");
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
        [Sequelize.col("userGames.created_at"), "subTitle2Value"],
      ],
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["nickName", "image"],
        },
      ],
      group: ["user_id", "buy_ins_amount", "userGames.created_at"], // Add the 'buy_ins_amount' column to the GROUP BY clause
      order: [[Sequelize.literal("titleValue"), "DESC"]],
      raw: true,
    });
    const formattedDate = format(
      new Date(maxProfit?.subTitle2Value),
      "dd/MM/yy"
    );
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

    res.status(200).json([
      {
        id: 1,
        title: "Total Profit",
        subTitle: "Total Games",
        subTitle2: "Average Profit",
        values: formattedStats,
      },
      {
        id: 2,
        title: "Top 10 Profits",
        subTitle: "Buy In",
        subTitle2: "Date",
        values: maxProfit,
      },
      {
        id: 3,
        title: "Profit Per Hour",
        subTitle: "Hours Played",
        subTitle2: "Buy In Per Hour",
        values: formattedHighestProfitPerHour,
      },
    ]);
  } catch (error) {
    console.error("Error retrieving main cards stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
