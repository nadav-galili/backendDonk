const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

module.exports = (req, res, next) => {
    const token = req.header("x-auth-token");
    console.log("🚀 ~ token:", token)
    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
        const decoded = jwt.verify(token, defaults.jwtKey);
        console.log("🚀 ~ decoded:", decoded)
        req.user = decoded;
        next();
    } catch (ex) {
        console.log("🚀 ~ ex:", ex)
        res.status(400).send("Invalid token.");
    }
};
