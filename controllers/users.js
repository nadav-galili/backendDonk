const multer = require("multer");
// const path = require("path");
const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const UserGameModel = require("../models/UserGame");
const LeagueModel = require("../models/League");
const UserLeaguemodel = require("../models/UserLeague");
const { Sequelize } = require("sequelize");
const { s3 } = require("../db");

const {
  calculateStreaks,
  calculateWinnLossRatio,
} = require("../utils/statsUtils");
const jwt = require("jsonwebtoken");
// const { sequelize } = require("../db");/
require("dotenv").config();

// Define multer storage utilsuration
const storage = multer.memoryStorage();
// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
});

const uploadImageToS3 = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("File or file buffer is missing");
  }
  const params = {
    Bucket: process.env.S3_BUCKET_NAME || config.S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read", // Use 'private' if you do not want public access
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // This is the public URL
  } catch (err) {
    console.error(err);
    throw new Error("Error uploading file to S3");
  }
};

exports.signup = async function (req, res) {
  const { password, nickName } = req.body;

  try {
    const existingUser = await UserModel.findOne({ where: { nickName } });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let imageUrl = "uploads/anonymos.png";

    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const newUser = await UserModel.create({
      password: hashedPassword,
      nickName,
      image: imageUrl ?? "uploads/anonymos.png",
    });

    // Generate token
    const jwtKey = process.env.JWTKEY;
    const token = jwt.sign(
      { userId: newUser.id, nickName: newUser.nickName, image: newUser.image },
      jwtKey
    );

    newUser.dataValues.token = token;

    delete newUser.dataValues.password;

    res.status(200).json({ message: "Signup successful", user: newUser });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updatePersonaldetails = async function (req, res) {
  console.log("🚀 ~ req:", req.body);
  const { nickName, userId } = req.body;
  const { file } = req;
  if (file) {
    console.log("File:", file);
  }

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const oldImage = user.image;

    const updatedUser = await UserModel.update(
      {
        nickName,
        image: req.file?.path.trim() ?? user.image,
      },
      { where: { id: userId } }
    );

    if (oldImage !== "uploads/anonymos.png") {
      const fs = require("fs");
      fs.unlinkSync(oldImage);
    }

    const jwtKey = process.env.JWTKEY;
    ///get existing token
    const token = jwt.sign(
      { userId: user.id, nickName: user.nickName, image: user.image },
      jwtKey
    );
    console.log("🚀 ~ token:", token);
    //get user's token

    res
      .status(200)
      .json({ message: "User updated.", token: token, user: updatedUser });
  } catch (err) {
    console.error("Error during updatePersonaldetails:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Export the upload instance to be used in the router file
exports.upload = upload;

exports.me = async function (req, res) {
  try {
    const userId = req?.user?.userId;
    if (!userId) return res.status(200).json({ message: "User has no token" });

    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    delete user.dataValues.password;
    res.status(200).json({ message: "User found.", user });
    // res.status(200).json({ message: "User found.", userId });
  } catch (err) {
    console.error("Error during me:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.login = async function (req, res) {
  const { password, nickName } = req.body;

  try {
    const existingUser = await UserModel.findOne({ where: { nickName } });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid nick name or password" });
    }
    //generate token
    const jwtKey = process.env.JWTKEY;
    const token = jwt.sign(
      {
        userId: existingUser.id,
        nickName: existingUser.nickName,
        image: existingUser.image,
      },
      jwtKey
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.personalStats = async function (req, res) {
  const userId = req.params.userId;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userGames = await UserGameModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: LeagueModel,
          attributes: ["league_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // // Calculate streaks
    const streaks = calculateStreaks(userGames);

    const getUserLeagues = await UserLeaguemodel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: LeagueModel,
          attributes: ["league_name"],
          as: "league",
        },
      ],
      group: ["league_id"],
    });

    let winnLossRatioForLeague = [];
    for (let i = 0; i < getUserLeagues.length; i++) {
      const winnLossRatio = await calculateWinnLossRatio(
        userId,
        getUserLeagues[i].league_id
      );
      winnLossRatioForLeague.push({
        winnLossRatio,
        leagueId: getUserLeagues[i].league_id,
        leagueName: getUserLeagues[i].league.league_name,
      });
    }

    const getUserTotalStats = await UserGameModel.findAll({
      where: { user_id: userId },
      attributes: [
        [
          UserGameModel.sequelize.fn(
            "COUNT",
            UserGameModel.sequelize.col("id")
          ),
          "totalGames",
        ],
        [
          UserGameModel.sequelize.fn(
            "SUM",
            UserGameModel.sequelize.col("profit")
          ),
          "totalProfit",
        ],
        [
          UserGameModel.sequelize.fn(
            "SUM",
            UserGameModel.sequelize.col("buy_ins_amount")
          ),
          "totalBuyInsAmount",
        ],
      ],
    });

    const getTotalHoursPlayedFromUserGames = await UserGameModel.findAll({
      where: { user_id: userId },
      attributes: [
        [
          UserGameModel.sequelize.literal(
            "SUM(TIMESTAMPDIFF(MINUTE, created_at, cash_out_time))/60"
          ),
          "totalHoursPlayed",
        ],
      ],
    });

    const getMaxProfitAndMinProfit = await UserGameModel.findAll({
      where: { user_id: userId },
      attributes: [
        [
          UserGameModel.sequelize.fn(
            "MAX",
            UserGameModel.sequelize.col("profit")
          ),
          "maxProfit",
        ],
        [
          UserGameModel.sequelize.fn(
            "MIN",
            UserGameModel.sequelize.col("profit")
          ),
          "minProfit",
        ],
        [
          UserGameModel.sequelize.fn(
            "MIN",
            UserGameModel.sequelize.col("season_rank")
          ),
          "maxSeasonRank",
        ],
      ],
    });

    const getCountOfGamesWithProfit = await UserGameModel.findAll({
      where: {
        user_id: userId,
        profit: { [Sequelize.Op.gt]: 0 },
      },
      attributes: [
        [
          UserGameModel.sequelize.fn(
            "COUNT",
            UserGameModel.sequelize.col("id")
          ),
          "gamesWithProfit",
        ],
      ],
    });

    const getAvgStats = await UserGameModel.findAll({
      where: { user_id: userId },
      attributes: [
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.col("profit")
            ),
            2
          ),
          "avgProfit",
        ],
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.col("buy_ins_amount")
            ),
            2
          ),
          "avgBuyInsAmount",
        ],
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.col("cash_in_hand")
            ),
            2
          ),
          "avgCashInHand",
        ],
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.col("game_rank")
            ),
            2
          ),
          "avgGameRank",
        ],
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.col("season_rank")
            ),
            2
          ),
          "avgSeasonRank",
        ],
        [
          UserGameModel.sequelize.fn(
            "ROUND",
            UserGameModel.sequelize.fn(
              "AVG",
              UserGameModel.sequelize.literal(
                "TIMESTAMPDIFF(MINUTE, created_at, cash_out_time)/60"
              )
            ),
            2
          ),
          "avgHoursPlayed",
        ],
      ],
    });

    const promises = [
      getUserTotalStats,
      userGames,
      streaks,
      winnLossRatioForLeague,
      getTotalHoursPlayedFromUserGames,
      getMaxProfitAndMinProfit,
      getCountOfGamesWithProfit,
      getAvgStats,
    ];
    //add the total hours played to the totalStats

    const [
      totalStats,
      games,
      streaksData,
      winLossRatios,
      totalHoursPlayed,
      userMaxMinProfit,
      gamesWithProfit,
      avgStats,
    ] = await Promise.all(promises);

    //assign to totalStats the totalHoursPlayed
    totalStats[0].dataValues.totalHoursPlayed = Number(
      totalHoursPlayed[0].dataValues.totalHoursPlayed
    ).toFixed(2);
    totalStats[0].dataValues.maxProfit =
      userMaxMinProfit[0].dataValues.maxProfit;
    totalStats[0].dataValues.minProfit =
      userMaxMinProfit[0].dataValues.minProfit;
    totalStats[0].dataValues.gamesWithProfit =
      gamesWithProfit[0].dataValues.gamesWithProfit;
    totalStats[0].dataValues.successRate = Number(
      (gamesWithProfit[0].dataValues.gamesWithProfit /
        totalStats[0].dataValues.totalGames) *
        100
    ).toFixed(2);
    totalStats[0].dataValues.maxSeasonRank =
      userMaxMinProfit[0].dataValues.maxSeasonRank;

    res.status(200).json({
      totalStats,
      games,
      streaksData,
      winLossRatios,
      avgStats,
    });
  } catch (err) {
    console.error("Error during personalStats:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};
