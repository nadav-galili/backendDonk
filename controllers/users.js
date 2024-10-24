const multer = require("multer");
// const path = require("path");
const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const UserGameModel = require("../models/UserGame");
const LeagueModel = require("../models/League");
const UserLeaguemodel = require("../models/UserLeague");
const { Sequelize } = require("sequelize");
const { s3 } = require("../db"); // Ensure s3 is correctly imported
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const {
  calculateWinnLossRatio,
  calculateUserStreaks,
  personalUserStreak,
} = require("../utils/statsUtils");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { sendMessageToTelegram } = require("../utils/telegramUtils"); // Import the function

// Define multer storage utilsuration
const storage = multer.memoryStorage();
// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
});

const uploadImageToS3 = async (file) => {
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

const findUserByGoogleId = (userId) => {
  return UserModel.findOne({ where: { google_id: userId } });
};

const generateSessionToken = (user) => {
  const sessionToken = jwt.sign(
    { userId: user.id, nickName: user.nickName },
    process.env.JWTKEY
  );
  return sessionToken;
};

exports.googleSignin = async function (req, res) {
  ///verify id
  const ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID;
  const WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;

  const client = new OAuth2Client();
  const { data } = req.body;
  const idToken = data?.idToken;
  if (!idToken) return res.status(400).json({ message: "idToken is required" });

  try {
    // Verify the ID token

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: [ANDROID_CLIENT_ID, WEB_CLIENT_ID],
    });

    // Get the user's Google account info
    const payload = ticket.getPayload();

    const userId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];
    const picture = payload["picture"];
    const givenName = payload["given_name"];
    const familyName = payload["family_name"];

    // Check if the user exists in your database
    let user = await findUserByGoogleId(userId);

    await sendMessageToTelegram(`User ${name} (ID: ${userId}) has logged in.`);

    if (user) {
      //generate token
      //update last_login
      await user.update({
        last_login: new Date(),
      });
      const token = generateSessionToken(user);
      user.dataValues.token = token;
      return res.status(200).json({ message: "Signin successful", user });
    }

    if (!user) {
      const newUser = await UserModel.create({
        google_id: userId,
        email,
        nickName: name,
        given_name: givenName,
        family_name: familyName,
        image: picture,
      });
      const token = generateSessionToken(newUser);
      newUser.dataValues.token = token;
      return res
        .status(200)
        .json({ message: "Signup successful", user: newUser });
    }
    res.status(200).json({ message: "Signup successful", user: newUser });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

exports.dashGoogleSignin = async function (req, res) {
  const { email } = req.body;
  let user = await UserModel.findOne({
    where: {
      email: email,
    },
  });

  if (!user) {
    res.status(401).json({ error: "user not found on db" });
  }
  if (user) {
    const token = generateSessionToken(user);
    user.dataValues.token = token;
    return res.status(200).json({ success: true, user });
  }
};

exports.signup = async function (req, res) {
  const { nickName } = req.body;

  try {
    const existingUser = await UserModel.findOne({ where: { nickName } });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
      imageUrl = imageUrl.split("uploads/");
      imageUrl = "uploads/" + imageUrl[1];
    }

    const newUser = await UserModel.create({
      nickName,
      image: imageUrl ?? "uploads/anonymous.png",
    });

    // Generate token
    const jwtKey = process.env.JWTKEY;
    const token = jwt.sign(
      { userId: newUser.id, nickName: newUser.nickName, image: newUser.image },
      jwtKey
    );

    newUser.dataValues.token = token;

    res.status(200).json({ message: "Signup successful", user: newUser });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const deleteImageFromS3 = async (url) => {
  const key = url.split("/").slice(-2).join("/");
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully from S3: ${url}`);
  } catch (err) {
    console.error("Error during S3 delete:", err);
  }
};

exports.updatePersonaldetails = async function (req, res) {
  const { nickName, userId } = req.body;
  const { file } = req;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let imageUrl = user.image;
    if (file) {
      console.log("File object:", file); // Debugging line
      imageUrl = await uploadImageToS3(file);
      imageUrl = imageUrl.split("uploads/");
      imageUrl = "uploads/" + imageUrl[1];
      // If there was an old image and it's not the default, delete it from S3
      if (user.image && user.image !== "uploads/anonymous.png") {
        await deleteImageFromS3(user.image);
      }
    }

    await user.update({
      nickName,
      image: imageUrl,
    });

    // Generate a new token with updated user details
    const jwtKey = process.env.JWTKEY;
    const token = jwt.sign(
      { userId: user.id, nickName: user.nickName, image: user.image },
      jwtKey
    );

    res.status(200).json({ message: "User updated.", token: token, user });
  } catch (err) {
    console.error("Error during updatePersonaldetails:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Export the upload instance to be used in the router file
exports.upload = upload;
exports.checkNotification = async function (req, res) {
  const userId = req.params.userId;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.expoPushToken) {
      return res.status(200).json({ message: "User has a token", user });
    } else {
      return res.status(200).json({ message: "User has no token", user });
    }
  } catch (error) {
    console.error("Error during checkNotification:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  const { isEnabled } = req.body;
  const userId = req.params.userId;
  try {
    const user = await UserModel.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.expoPushToken && isEnabled) {
      return res.status(200).json({ message: "User doesent need to update" });
    }

    if (user.expoPushToken && !isEnabled) {
      await user.update({
        expoPushToken: null,
      });
      return res.status(200).json({ message: "Notification was disabled." });
    }

    if (!user.expoPushToken && isEnabled) {
      return res.status(200).json({ message: "User doesent have a token" });
    }

    if (!user.expoPushToken && !isEnabled) {
      return res.status(200).json({ message: "User doesent need to update" });
    }
  } catch (err) {
    console.error("Error during updateNotificationSettings:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};
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
  } catch (err) {
    console.error("Error during me:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.login = async function (req, res) {
  let { google_id } = req.body;

  try {
    if (!google_id) {
      return res.status(400).json({ error: "Google ID is required." });
    }
    const existingUser = await findUserByGoogleId(google_id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    await existingUser.update({
      last_login: new Date(),
    });

    // Generate token
    const jwtKey = process.env.JWTKEY;
    const token = jwt.sign(
      {
        userId: existingUser.id,
        nickName: existingUser.nickName,
        image: existingUser.image,
      },
      jwtKey
    );

    // Send Telegram notification
    await sendMessageToTelegram(
      `User ${existingUser.nickName} (ID: ${existingUser.id}) has logged in.`
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
    if (userGames.length === 0) {
      return res.status(200).json({
        message: "No games found.",
        games: [],
      });
    }

    const userStreak = await UserGameModel.findAll({
      attributes: [
        "user_id",
        "game_id",
        [Sequelize.fn("SUM", Sequelize.col("profit")), "total_profit"],
      ],
      where: { user_id: userId },
      group: ["user_id", "game_id"],
      include: [
        {
          model: UserModel,
          attributes: ["id", "image", "nickName"],
        },
      ],
      order: ["user_id", ["game_id", "ASC"]],
    });
    if (userGames.length === 0) {
      return res.status(200).json({
        message: "No games found.",
        games: [],
      });
    }

    const streaks = personalUserStreak(userStreak);

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
      message: "Personal stats found.",
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

exports.expoPushTokens = async function (req, res) {
  const { expoPushToken } = req.body;
  const { userId } = req.params;
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    await user.update({
      expoPushToken: expoPushToken,
    });
    res.status(200).json({ message: "Expo push token updated." });
  } catch (err) {
    console.error("Error during updatePersonaldetails:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteAccount = async function (req, res) {
  const { userId } = req.params;
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    await user.update({
      nickName: "Deleted User",
      image: "uploads/anonymous.png",
      given_name: "deleted",
      family_name: "deleted",
      email: `deleted-${userId}`,
      google_id: `deleted-${userId}`,
      expoPushToken: null,
      is_active: false,
    });

    res.status(200).json({ message: "User deleted." });
  } catch (err) {
    console.error("Error during deleteAccount:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.testUserDetails = async function (req, res) {
  try {
    const testUser = await UserModel.findOne({
      where: {
        email: "demodonkey596@gmail.com",
      },
    });
    if (!testUser) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "Test user found.", testUser });
  } catch (error) {
    console.error("Error during testUserDetails:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.userRestored = async function (req, res) {
  const { nickName, userId } = req.body;
  await sendMessageToTelegram(
    `User ${nickName} (ID: ${userId}) has been restored.`
  );
  res.status(200).json({ message: "User restored." });
};
