const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const statsController = require("../controllers/stats");

router.get("/getLeagueStats/:leagueId", auth, statsController.getLeagueStats);
router.get("/getPlayersStats/:leagueId", auth, statsController.getPlayersStats);
router.get(
  "/getMainCardsStats/:leagueId",
  auth,
  statsController.getMainCardsStats
);
router.get("/totalProfit/:leagueId", auth, statsController.totalProfitForCard);
router.get(
  "/top10Profits/:leagueId",
  auth,
  statsController.top10ProfitsForCard
);
router.get("/profitPerHour/:leagueId", auth, statsController.profitPerHour);
router.get("/top10Comebacks/:leagueId", auth, statsController.top10Comebacks);
router.get("/winningStreak/:leagueId", auth, statsController.winningStreak);

module.exports = router;
