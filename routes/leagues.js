const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const leagueController = require("../controllers/league");

router.get("/myLeagues/:userId", auth, leagueController.myLeagues);

module.exports = router;
