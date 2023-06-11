const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const leagueController = require("../controllers/league");
const upload = leagueController.upload;

router.get("/myLeagues/:userId", auth, leagueController.myLeagues);

router.post("/createLeague", auth, upload.single("image"), leagueController.createLeague);

module.exports = router;
