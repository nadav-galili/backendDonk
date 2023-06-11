const init = require("../models/init");
// const User = require("../models/user");
// const League = require("../models/league");
const UserModel = require("../models/User");
const UserLeague = require("../models/UserLeague");
const Leaguemodel = require("../models/League");
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
    try {
        const user = await UserModel.findOne({
            where: { id: userId },
            include: [
                {
                    model: UserLeague,
                    as: "userLeagues", // Make sure the alias matches the association alias
                    include: [
                        {
                            model: Leaguemodel,
                            as: "League",
                        },
                    ],
                },
            ],
        });

        res.status(200).json(user.userLeagues);
    } catch (error) {
        // Handle error
        console.error(error);
        return null;
    }
};

exports.createLeague = async (req, res) => {
    console.log("🚀 ~ file: league.js:36 ~ exports.createLeague= ~ req:", req.body);

    const { file } = req;
    if (file) {
        console.log("File:", file);
    }
    const { leagueName, userId } = req.body;

    try {
        const newLeague = await Leaguemodel.create({
            league_name: leagueName,
            league_image: req.file?.path ?? "leagueAvatars/league.jpg",
            admin_id: userId,
        });

        const newUserLeague = await UserLeague.create({
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
