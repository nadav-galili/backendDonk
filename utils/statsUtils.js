const Sequelize = require("sequelize");
const UserGameModel = require("../models/UserGame");

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
