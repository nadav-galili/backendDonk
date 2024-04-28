const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const userController = require("../controllers/users");
const upload = userController.upload;

//signup
router.post("/signup", upload.single("image"), userController.signup);

//login
router.post("/login", userController.login);
//get my user info
router.get("/me", userController.me);
router.get("/personalStats/:userId", auth, userController.personalStats);
module.exports = router;
