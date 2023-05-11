const express = require("express");
const router = express.Router();

const userController = require("../controllers/users");
const upload = userController.upload;

router.post("/signup", upload.single("image"), userController.signup);

module.exports = router;
