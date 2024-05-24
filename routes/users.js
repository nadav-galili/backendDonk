const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const userController = require("../controllers/users");
const upload = userController.upload;

// Signup route with image upload
router.post("/signup", upload.single("image"), userController.signup);

// Other routes
router.post("/login", userController.login);
router.get("/me", userController.me);
router.get("/personalStats/:userId", auth, userController.personalStats);
router.put(
  "/updatePersonaldetails",
  auth,
  upload.single("image"),
  userController.updatePersonaldetails
);

module.exports = router;
