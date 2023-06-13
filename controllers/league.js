const init = require("../models/init");
// const User = require("../models/user");
// const League = require("../models/league");
const UserModel = require("../models/User");
const UserLeagueModel = require("../models/UserLeague");
const LeagueModel = require("../models/League");
const { generateLeagueNumber } = require("../models/League");
const multer = require("multer");
const path = require("path");

// Define multer storage utilsuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "leagueAvatars/");
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        let fileName = path.basename(file.originalname, ext);
        cb(null, fileName + "-" + Date.now() + ext);
    },
});

// Create the multer upload instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
});

// Export the upload instance to be used in the router file
exports.upload = upload;

exports.myLeagues = async (req, res) => {
    const userId = req.params.userId;
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
                    const admin = await UserModel.findOne({
                        attributes: ["id", "nickName", "image"],
                        where: { id: userLeague.league.dataValues.admin_id },
                    });
                    userLeague.league.dataValues.leagueAdmin = admin;
                })
            );
        })
    );

    let leaguePlayers = [];
    await Promise.all(
        (leaguePlayers = await UserLeagueModel.findAll({
            where: { league_id: user[0].dataValues.userLeagues[0]?.league.dataValues.id },
            include: [
                {
                    model: UserModel,
                    attributes: ["id", "nickName", "image"],
                    as: "User",
                },
            ],
        }))
    );

    return res.status(200).json({
        message: "Leagues found",
        user,
        leaguePlayers,
    });
};

exports.createLeague = async (req, res) => {
    console.log("🚀 ~ file: league.js:36 ~ exports.createLeague= ~ req:", req.body);

    const { file } = req;
    if (file) {
        console.log("File:", file);
    }
    const { leagueName, userId } = req.body;

    try {
        const newLeague = await LeagueModel.create({
            league_name: leagueName,
            league_image: req.file?.path ?? "leagueAvatars/league.jpg",
            admin_id: userId,
            league_number: await generateLeagueNumber(Leaguemodel),
        });

        const newUserLeague = await UserLeagueModel.create({
            user_id: userId,
            league_id: newLeague.id,
            is_admin: true,
        });
        return res.status(200).json({ message: "League created", league: newLeague, userLeague: newUserLeague });
    } catch (err) {
        console.error("Error during create league:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.joinLeague = async (req, res) => {
    const { leagueNumber, userId } = req.params;
    const league = await LeagueModel.findOne({
        where: { league_number: leagueNumber },
    });
    if (!league) {
        return res.status(404).json({ message: "League number not found" });
    }

    if (league.dataValues.admin_id == userId) {
        return res.status(400).json({ message: "You are already the admin of this league" });
    }

    const isUSerAlreadyInLeague = await UserLeagueModel.findOne({
        where: { user_id: userId, league_id: league.id },
    });

    if (isUSerAlreadyInLeague) {
        return res.status(400).json({ message: "You are already in this league" });
    }

    const userLeague = await UserLeagueModel.create({
        user_id: parseInt(userId),
        league_id: parseInt(league.id),
        is_admin: false,
    });

    return res.status(200).json({ message: "League joined", userLeague });

    // const user = await UserModel.findOne({
    //     where: { id: userId },
    //     attributes: ["id", "nickName", "image"],
    //     include: [
    //         {
    //             model: UserLeagueModel,
    //             as: "userLeagues",
    //             include: [
    //                 {
    //                     model: LeagueModel,
    //                     as: "league",
    //                 },
    //             ],
    //         },
    //     ],
    // });

    // await Promise.all(
    //     user.dataValues.userLeagues.map(async (userLeague) => {
    //         const admin = await UserModel.findOne({
    //             attributes: ["id", "nickName", "image"],
    //             where: { id: userLeague.league?.dataValues.admin_id },
    //         });
    //         userLeague.league.dataValues.leagueAdmin = admin;
    //     })
    // );

    // return res.status(200).json({ message: "League joined", userLeague, user });
};
