const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const gameController = require("../controllers/game");

router.post("/newGame", auth, gameController.newGame);
router.post("/addBuyInToPlayer", auth, gameController.addBuyInToPlayer);
router.get(
  "/getUserGamesByGameId/:gameId",
  auth,
  gameController.getUserGamesByGameId
);
router.get("/getGameDetails/:gameId", auth, gameController.getGameDetails);
router.put("/cashOutPlayer", auth, gameController.cashOutPlayer);
router.put("/endGame", auth, gameController.endGame);
router.get("/allGames/:leagueId", auth, gameController.getAllGames);

module.exports = router;
