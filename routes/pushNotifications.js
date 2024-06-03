const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const pushNotificationController = require("../controllers/pushNotifications");
 
router.post('/leaguePush/:leagueId',auth,pushNotificationController.leaguePush);

module.exports = router;