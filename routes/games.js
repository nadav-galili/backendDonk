const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const gameController = require("../controllers/game");
// const leagueController = require("../controllers/league");
// const upload = leagueController.upload;

router.post("/newGame", auth, gameController.newGame);

// router.get("/myLeagues/:userId", auth, leagueController.myLeagues);

// router.post("/createLeague", auth, upload.single("image"), leagueController.createLeague);

// router.put("/joinLeague/:leagueNumber/:userId", auth, leagueController.joinLeague);

module.exports = router;
