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
    // res.status(200).json({ message: `created ${leagueName}` });
    try {
        const existingLeague = await Leaguemodel.findOne({ where: { league_name: leagueName } });
        console.log("🚀 ~ file: users.js:43 ~ existingUser:", existingLeague);
        if (existingLeague) {
            return res.status(400).json({ message: "League already exists." });
        }
        const newLeague = await Leaguemodel.create({
            league_name: leagueName,
            league_image: req.file?.path ?? "leagueAvatars/anonymos.png",
            admin_id: userId,
        });
        return res.status(200).json({ message: "League created", league: newLeague });
    } catch (err) {
        console.error("Error during create league:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};
