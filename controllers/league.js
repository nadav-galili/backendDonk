const init = require("../models/init");
// const User = require("../models/user");
// const League = require("../models/league");
const UserModel = require("../models/User");
const UserLeague = require("../models/UserLeague");
const Leaguemodel = require("../models/League");

exports.myLeagues = async (req, res) => {
    const userId = req.params.userId;
    console.log("🚀 ~ file: league.js:8 ~ exports.myLeagues= ~ userId:", userId);
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
