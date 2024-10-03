const Sequelize = require("sequelize");
const UserGameModel = require("../models/UserGame");
const UserLeagueModel = require("../models/UserLeague");
const UserModel = require("../models/User");
const dayjs = require("dayjs");

exports.noGamesTotalProfitCard = async (leagueId) => {
  const leaguePlayer = await UserLeagueModel.findAll({
    include: [
      {
        model: UserModel,
        attributes: ["id", "nickName", "image"],
      },
    ],
    where: {
      league_id: leagueId,
    },
  });

  return leaguePlayer.map((player) => ({
    id: player.user_id,
    nickName: player.User.nickName,
    image: player.User.image,
    title: 0,
    subTitle: 0,
    subTitle2: 0,
  }));
};

exports.noGamesLeagueObject = async (leagueId) => {
  const leaguePlayer = await UserLeagueModel.findOne({
    include: [
      {
        model: UserModel,
        attributes: ["id", "nickName", "image"],
      },
    ],
    where: {
      league_id: leagueId,
    },
  });

  const stats = [
    {
      id: 1,
      title: "Total Profit",
      apiRoute: "totalProfit",
      cardTitle: "Total Profit",
      subTitle: "Total Games",
      subTitle2: "Average Profit",
      values: {
        id: leaguePlayer.user_id,
        titleValue: "0",
        subTitleValue: 0,
        subTitle2Value: "0",
        nickName: leaguePlayer?.User?.nickName,
        image: leaguePlayer?.User?.image,
      },
    },
    {
      id: 2,
      title: "Top 10 Profits",
      apiRoute: "top10Profits",
      cardTitle: "Profit",
      subTitle: "Buy In",
      subTitle2: "Date",
      values: {
        titleValue: 0,
        subTitleValue: 0,
        subTitle2Value: dayjs().format("DD/MM/YYYY"),
        nickName: leaguePlayer?.User?.nickName,
        image: leaguePlayer?.User?.image,
      },
    },
    {
      id: 3,
      title: "Profit Per Hour",
      apiRoute: "profitPerHour",
      cardTitle: "Profit per hour",
      subTitle: "Hours Played",
      subTitle2: "Buy In Per Hour",
      values: {
        id: leaguePlayer.user_id,
        nickName: leaguePlayer?.User?.nickName,
        image: leaguePlayer?.User?.image,
        titleValue: 0,
        subTitleValue: "0",
        subTitle2Value: "0.00",
      },
    },
    {
      id: 4,
      title: "Top 10 Comebacks",
      apiRoute: "top10Comebacks",
      cardTitle: "Profit",
      subTitle: "Buy In",
      subTitle2: "Date",
      values: {
        id: leaguePlayer.user_id,
        nickName: leaguePlayer?.User?.nickName,
        image: leaguePlayer?.User?.image,
        titleValue: 0,
        subTitleValue: 0,
        subTitle2Value: dayjs().format("DD/MM/YYYY"),
      },
    },
    {
      id: 5,
      title: "Winning Streak",
      apiRoute: "winningStreak",
      cardTitle: "Max Streak",
      subTitle: "Current Streak",
      subTitle2: "Win Rate %",
      values: {
        id: leaguePlayer.user_id,
        nickName: leaguePlayer?.User?.nickName,
        image: leaguePlayer?.User?.image,
        titleValue: 0,
        subTitleValue: 0,
        subTitle2Value: "0.00",
      },
    },
  ];

  return stats;
};

exports.calculateStreaks = (games) => {
  let results = [];

  let currentUserId = null;
  let lastGameId = -1;
  let currentStreak = 0;
  let maxStreak = 0;

  games.forEach((game) => {
    if (game.user_id !== currentUserId) {
      // Reset for a new user
      if (currentUserId !== null) {
        results.push({
          id: currentUserId,
          nickName: game?.User?.nickName,
          image: game?.User?.image,
          title: maxStreak.toFixed(0),
          subTitle: currentStreak.toFixed(0),
        });
      }
      currentUserId = game.user_id;
      lastGameId = game.game_id;
      currentStreak = 1; // Start a new streak
      maxStreak = 1;
    } else {
      // Continue with the same user
      if (game.game_id === lastGameId + 1) {
        currentStreak++; // Increment streak if games are consecutive
      } else {
        currentStreak = 1; // Reset streak if not consecutive
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      lastGameId = game.game_id;
    }
  });

  // Final user's streak
  if (currentUserId !== null) {
    results.push({
      id: currentUserId,
      nickName: games[games.length - 1]?.User?.nickName,
      image: games[games.length - 1]?.User?.image,
      title: maxStreak.toFixed(0),
      subTitle: currentStreak.toFixed(0),
    });
  }

  return results;
};

exports.calculateWinnLossRatio = async (playerId, leagueId) => {
  //get all games for this league, and count the number of wins and losses for each player
  const winns = await UserGameModel.count({
    where: {
      league_id: leagueId,
      user_id: playerId,
      profit: { [Sequelize.Op.gt]: 0 },
    },
  });
  const loss = await UserGameModel.count({
    where: {
      league_id: leagueId,
      user_id: playerId,
      profit: { [Sequelize.Op.lt]: 0 },
    },
  });
  const ratio = (winns / (winns + loss)) * 100;
  return ratio.toFixed(2);
};

exports.calculateUserStreaks = (games) => {
  const users = {};

  games.forEach((game) => {
    const userId = game.user_id;
    const profit = parseFloat(game?.dataValues?.total_profit);

    if (!users[userId]) {
      users[userId] = {
        nickName: game.User.nickName,
        image: game.User.image,
        currentStreak: 0,
        maxStreak: 0,
        lastProfit: null,
        totalGames: 0,
        profitableGames: 0,
      };
    }

    users[userId].totalGames++;
    if (profit > 0) {
      users[userId].profitableGames++;
      if (users[userId].lastProfit === null || users[userId].lastProfit <= 0) {
        // Start of a new streak
        users[userId].currentStreak = 1;
      } else {
        // Continuing the streak
        users[userId].currentStreak++;
      }
      users[userId].maxStreak = Math.max(
        users[userId].maxStreak,
        users[userId].currentStreak
      );
    } else {
      // End of streak
      users[userId].currentStreak = 0;
    }

    users[userId].lastProfit = profit;
  });

  return Object.entries(users)
    .map(([userId, data]) => ({
      id: userId,
      nickName: data.nickName,
      image: data.image,
      title: data.maxStreak,
      subTitle: data.currentStreak,
      subTitle2: calculateWinLossRatio(data.profitableGames, data.totalGames),
    }))
    .sort((a, b) => b.title - a.title);
};

// Helper function to calculate and format the win-loss ratio
const calculateWinLossRatio = (profitableGames, totalGames) => {
  if (totalGames === 0) return "0.00%";
  const ratio = (profitableGames / totalGames) * 100;
  return ratio.toFixed(2);
};

exports.personalUserStreak = (games) => {
  let currentStreak = 0;
  let maxStreak = 0;
  let userId = null;

  for (const game of games) {
    userId = game.user_id;
    const profit = parseFloat(game?.dataValues?.total_profit);

    if (profit > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return [
    {
      id: parseInt(userId),
      title: currentStreak.toString(),
      subTitle: maxStreak.toString(),
    },
  ];
};
