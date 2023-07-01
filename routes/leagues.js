const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const leagueController = require("../controllers/league");
const upload = leagueController.upload;

router.get("/myLeagues/:userId", auth, leagueController.myLeagues);

router.post("/createLeague", auth, upload.single("image"), leagueController.createLeague);

router.put("/joinLeague/:leagueNumber/:userId", auth, leagueController.joinLeague);

module.exports = router;
