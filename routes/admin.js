const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const adminAuth = require("../middleware/adminAuth");

// router.post("/makeAdmin", adminController.makeAdmin);
router.post("/adminLogin", adminController.adminLogin);
router.get("/getLeagues", adminAuth, adminController.getLeagues);
router.get(
  "/getLeagueDetails/:leagueId",
  adminAuth,
  adminController.getLeagueDetails
);

module.exports = router;
