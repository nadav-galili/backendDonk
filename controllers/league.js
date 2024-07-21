const init = require("../models/init");

const UserModel = require("../models/User");
const UserLeagueModel = require("../models/UserLeague");
const LeagueModel = require("../models/League");
const { generateLeagueNumber } = require("../models/League");
const multer = require("multer");
const { s3 } = require("../db");
require("dotenv").config();

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
    Key: `leagueAvatars/${Date.now()}_${file.originalname}`,
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

// Export the upload instance to be used in the router file
exports.upload = upload;

exports.myLeagues = async (req, res) => {
  const userId = req.user?.userId;
 
  const user = await UserModel.findAll({
    where: { id: userId },
    attributes: ["id", "nickName", "image"],
    include: [
      {
        model: UserLeagueModel,
        as: "userLeagues",
        include: [
          {
            model: LeagueModel,
            as: "league",
          },
        ],
      },
    ],
  });
 

  await Promise.all(
    user.map(async (user) => {
      await Promise.all(
        user.dataValues.userLeagues.map(async (userLeague) => {
          if(userLeague.league.dataValues.admin_id){
          const admin = await UserModel.findOne({
            attributes: ["id", "nickName", "image"],
            where: { id: userLeague.league.dataValues.admin_id },
          });
          userLeague.league.dataValues.leagueAdmin = admin;
        }
        })
      
      );
    })
  );

  let leaguePlayers = [];
  //execute only if user has a league
  if (user[0]?.dataValues.userLeagues[0]?.league?.dataValues?.id) {
    await Promise.all(
      (leaguePlayers = await UserLeagueModel.findAll({
        where: {
          league_id: user[0]?.dataValues.userLeagues[0]?.league?.dataValues?.id,
        },
        include: [
          {
            model: UserModel,
            attributes: ["id", "nickName", "image"],
            as: "User",
          },
        ],
      }))
    );
  }

  if (user[0].userLeagues.length === 0) {
    return res.status(200).json({
      message: "No leagues found",
      leagues: [],
      user,
    });
  }

  return res.status(200).json({
    message: "Leagues found",
    leagues: user[0].userLeagues,
    user,
    leaguePlayers,
  });
};

exports.createLeague = async (req, res) => {
  const { leagueName, userId } = req.body;
  let imageUrl = null;
  const { file } = req;
  if (file) {
    imageUrl = await uploadImageToS3(req.file);
    imageUrl = imageUrl.split("leagueAvatars/");
    imageUrl = "leagueAvatars/" + imageUrl[1];
  }
  try {
    const newLeague = await LeagueModel.create({
      league_name: leagueName,
      league_image: imageUrl ?? "leagueAvatars/league.jpg",
      admin_id: userId,
      league_number: await generateLeagueNumber(LeagueModel),
    });

    const newUserLeague = await UserLeagueModel.create({
      user_id: userId,
      league_id: newLeague.id,
      is_admin: true,
    });
    return res.status(200).json({
      message: "League created",
      league: newLeague,
      userLeague: newUserLeague,
    });
  } catch (err) {
    console.error("Error during create league:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.joinLeague = async (req, res) => {
  const { leagueNumber, userId } = req.params;
  let league = await LeagueModel.findOne({
    where: { league_number: leagueNumber },
  });

  if (!league) {
    return res.status(404).json({ message: "League number not found" });
  }

  if (league.dataValues.admin_id == userId) {
    return res
      .status(400)
      .json({ error: "You are already the admin of this league" });
  }

  const isUSerAlreadyInLeague = await UserLeagueModel.findOne({
    where: { user_id: userId, league_id: league.id },
  });

  if (isUSerAlreadyInLeague) {
    return res.status(400).json({ error: "You are already in this league" });
  }

  const userLeague = await UserLeagueModel.create({
    user_id: parseInt(userId),
    league_id: parseInt(league.id),
    is_admin: false,
  });

  const leaguePlayers = await UserLeagueModel.findAll({
    where: { league_id: league.id },
    include: [
      {
        model: UserModel,
        attributes: ["id", "nickName", "image"],
        as: "User",
      },
    ],
  });

  return res
    .status(200)
    .json({ message: "League joined", league, userLeague, leaguePlayers });
};

exports.getLeaguePlayersByLeagueId = async (req, res) => {
  const { leagueId } = req.params;

  const leaguePlayers = await UserLeagueModel.findAll({
    where: { league_id: leagueId },
    include: [
      {
        model: UserModel,
        attributes: ["id", "nickName", "image"],
        as: "User",
      },
    ],
  });

  return res.status(200).json({ leaguePlayers });
};
