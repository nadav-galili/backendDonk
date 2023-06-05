const UserModel = require("User");
UserModel.sync({ force: false }).then(() => {
    console.log("User table created");
});
