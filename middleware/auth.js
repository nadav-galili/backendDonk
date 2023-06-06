const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

module.exports = (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
        const decoded = jwt.verify(token, defaults.jwtKey);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send("Invalid token.");
    }
};
