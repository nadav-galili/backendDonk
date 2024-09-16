const AdminModel = require("../models/Admin");
const LeagueModel = require("../models/League");
const UserModel = require("../models/User");
const UserLeaguemodel = require("../models/UserLeague");
const GamesModel = require("../models/Game");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");

// exports.makeAdmin = async (req, res) => {
//   const { userName, password } = req.body;
//   if (!userName || !password)
//     return res.status(400).send("Please provide username and password");

//   try {
//     const existingAdmin = await AdminModel.findOne({ where: { userName } });
//     if (existingAdmin)
//       return res.status(400).send("Admin already exists with this username");

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newAdmin = await AdminModel.create({
//       username: userName,
//       password: hashedPassword,
//     });

//     const jwtKey = process.env.AdminKey;
//     const token = jwt.sign(
//       { userId: newAdmin.id, userName: newAdmin.userName },
//       jwtKey
//     );

//     newAdmin.dataValues.token = token;

//     res
//       .status(200)
//       .json({ message: "Admin created successfully", admin: newAdmin });
//   } catch (error) {
//     console.error("Error during admin creation:", error);
//     res.status(500).send("Internal server error");
//   }
// };

exports.adminLogin = async function (req, res) {
  let { userName, password } = req.body;

  try {
    const admin = await AdminModel.findOne({ where: { userName } });
    if (!admin) return res.status(404).send("Admin not found");

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(400).send("Invalid password");

    const jwtKey = process.env.AdminKey;
    const token = jwt.sign(
      { userId: admin.id, userName: admin.userName },
      jwtKey
    );

    admin.dataValues.token = token;
    delete admin.dataValues.password;

    res.status(200).json({ message: "Admin logged in successfully", admin });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getLeagues = async (req, res) => {
  try {
    const leagues = await LeagueModel.findAll({
      include: [
        {
          model: UserModel,
          as: "admin", // This should match the association alias in your League model
          attributes: ["id", "nickName", "image"], // Specify the User fields you want to include
          required: true, // This makes it an INNER JOIN
        },
      ],
    });
    //count leagues
    const leagueCount = await LeagueModel.count();
    //count users
    const userCount = await UserModel.count();
    const gamesCount = await GamesModel.count();

    const leaguesData = { leagues, leagueCount, userCount, gamesCount };
    res.status(200).json(leaguesData);
  } catch (error) {
    console.error("Error during getLeagues:", error);
    res.status(500).send("Internal server error");
  }
};

exports.getLeagueDetails = async (req, res) => {
  const { leagueId } = req.params;
  try {
    ////get details for all the users in the league
    const leagueDetails = await UserLeaguemodel.findAll({
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          as: "User", // This should match the association alias in your UserLeague model
          attributes: ["id", "nickName", "image"], // Specify the User fields you want to include
          required: true, // This makes it an INNER JOIN
        },
      ],
    });

    const league = await LeagueModel.findOne({ where: { id: leagueId } });

    const details = { league, leagueDetails };
    res.status(200).json(details);
  } catch (error) {
    console.error("Error during getLeagues:", error);
    res.status(500).send("Internal server error");
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error during getUsers:", error);
    res.status(500).send("Internal server error");
  }
};
