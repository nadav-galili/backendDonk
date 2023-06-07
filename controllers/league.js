const League = require("../models/league");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

exports.myLeagues = async (req, res) => {
    // const token = req.header("x-auth-token");
    // try {
    //     const decoded = jwt.verify(token, defaults.jwtKey);
    //     const userId = decoded.userId;
    //     res.status(200).send("ussrId: " + userId);
    // } catch (ex) {
    //     console.log("🚀 ~ file: league.js:43 ~ exports.myLeagues= ~ ex", ex);
    //     res.status(400).send("Ikkknvalid token.");
    // }
    res.status(200).send("myLeagues");
};
