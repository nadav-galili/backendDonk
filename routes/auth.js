const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  let user = await UserModel.findOne({
    where: { nickName: req.body.nickName },
  });
  if (!user) return res.status(400).send("Invalid nickName or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid nickName or password.");
  const token = user.generateAuthToken();
  user.dataValues.token = token;
  //delete user.dataValues.password;
  return res.status(200).send(user);
});
module.exports = router;
