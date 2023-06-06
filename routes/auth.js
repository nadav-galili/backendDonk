const bcrypt = require("bcrypt");
const User = require("../models/user");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    console.log("req.body", req.body);
    let user = await User.findOne({ where: { nickName: req.body.nickName } });
    console.log("🚀 ~ file: auth.js:10 ~ router.post ~ user:", user);
    if (!user) return res.status(400).send("Invalid nickName or password.");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send("Invalid nickName or password.");
    const token = user.generateAuthToken();
    user.dataValues.token = token;
    return res.status(200).send(user);
});
module.exports = router;
