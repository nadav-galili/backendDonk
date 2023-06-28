const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const gameController = require("../controllers/game");

router.post("/newGame", auth, gameController.newGame);
router.post("/addBuyInToPlayer", auth, gameController.addBuyInToPlayer);
router.get("/getUserGamesByGameId/:gameId", auth, gameController.getUserGamesByGameId);

module.exports = router;