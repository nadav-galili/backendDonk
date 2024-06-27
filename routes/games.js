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
router.post(
  "/removeLastBuyInToPlayer",
  auth,
  gameController.removeLastBuyInToPlayer
);
router.get("/getGameDetails/:gameId", auth, gameController.getGameDetails);
router.put("/cashOutPlayer", auth, gameController.cashOutPlayer);
router.put("/endGame", auth, gameController.endGame);
router.get("/getAllGamesForLeague/", auth, gameController.getAllGames);
router.get("/checkIfOpenGameExist", auth, gameController.checkIfOpenGameExist);
router.put("/addRemovePlayersFromGame", auth, gameController.addRemovePlayersFromGame);
module.exports = router;
