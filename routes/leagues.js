const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const leagueController = require("../controllers/league");
const upload = leagueController.upload;

router.get("/myLeagues/:userId", leagueController.myLeagues);

router.post(
  "/createLeague",
  auth,
  upload.single("image"),
  leagueController.createLeague
);

router.put(
  "/joinLeague/:leagueNumber/:userId",
  auth,
  leagueController.joinLeague
);
router.get(
  "/getLeaguePlayersByLeagueId/:leagueId",
  auth,

  leagueController.getLeaguePlayersByLeagueId
);

router.put(
  "/updateLeagueDetails",
  upload.single("image"),
  auth,
  leagueController.updateLeagueDetails
);

router.delete("/deleteLeague/:leagueId", auth, leagueController.deleteLeague);
module.exports = router;
