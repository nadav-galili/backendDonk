const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const statsController = require("../controllers/stats");

router.get("/getLeagueStats/:leagueId", statsController.getLeagueStats);
router.get("/getPlayersStats/:leagueId", statsController.getPlayersStats);
router.get("/getMainCardsStats/:leagueId", statsController.getMainCardsStats);
router.get("/totalProfit/:leagueId", statsController.totalProfitForCard);
router.get("/top10Profits/:leagueId", statsController.top10ProfitsForCard);
router.get("/profitPerHour/:leagueId", statsController.profitPerHour);

module.exports = router;
