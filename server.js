const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const users = require("./routes/users");
const auth = require("./routes/auth");

const mysql = require("mysql");
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

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
