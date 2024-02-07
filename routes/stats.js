const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const statsController = require("../controllers/stats");

router.get("/getLeagueStats/:leagueId", statsController.getLeagueStats);
router.get("/getPlayersStats/:leagueId", statsController.getPlayersStats);
router.get("/getMainCardsStats/:leagueId", statsController.getMainCardsStats);

module.exports = router;
