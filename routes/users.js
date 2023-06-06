const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const userController = require("../controllers/users");
const upload = userController.upload;
//signup
router.post("/signup", upload.single("image"), userController.signup);

//get my user info
// router.get("/me", auth, userController.me);
module.exports = router;
