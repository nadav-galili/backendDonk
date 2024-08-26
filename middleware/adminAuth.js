const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.header("x-admin-token");
  if (!token)
    return res
      .status(401)
      .send("Access denied. No token provided for this path.");

  try {
    const decoded = jwt.verify(token, process.env.AdminKey);
    req.user = decoded;
    next();
  } catch (ex) {
    console.log("🚀 ~ ex:", ex);
    res.status(400).send("Invalid token.");
  }
};
