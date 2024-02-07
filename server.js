const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const users = require("./routes/users");
const leagues = require("./routes/leagues");
const games = require("./routes/games");
const auth = require("./routes/auth");
const stats = require("./routes/stats");
const path = require("path");
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to myApp application." });
});

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/leagues", leagues);
app.use("/api/games", games);
app.use("/api/stats", stats);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/leagueAvatars",
  express.static(path.join(__dirname, "leagueAvatars"))
);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
