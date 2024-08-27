const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const userController = require("../controllers/users");
const upload = userController.upload;

// Signup route with image upload
router.post("/signup", upload.single("image"), userController.signup);
router.post("/googleSignin", userController.googleSignin);
// Other routes
router.post("/login", userController.login);
router.get("/me", userController.me);
router.get("/checkNotification/:userId", userController.checkNotification);
router.get("/personalStats/:userId", auth, userController.personalStats);
router.put(
  "/updatePersonaldetails",
  auth,
  upload.single("image"),
  userController.updatePersonaldetails
);
router.put("/updateExpoPushToken/:userId", auth, userController.expoPushTokens);
router.put(
  "/updateNotificationSettings/:userId",
  auth,
  userController.updateNotificationSettings
);
router.delete("/deleteAccount/:userId", auth, userController.deleteAccount);
router.post("/dashGoogle", auth, userController.dashGoogleSignin);
module.exports = router;
