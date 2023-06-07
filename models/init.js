const UserModel = require("User");
const LeagueModel = require("League");
UserModel.sync({ force: false }).then(() => {
    console.log("User table created");
});
LeagueModel.sync({ force: false }).then(() => {
    console.log("League table created");
});
