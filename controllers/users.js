const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const defaults = require("../utils/default.json");

// Define multer storage utilsuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
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

exports.signup = async function (req, res) {
    const { password, nickName } = req.body;

    try {
        const existingUser = await UserModel.findOne({ where: { nickName } });
        // console.log("🚀 ~ file: users.js:43 ~ existingUser:", existingUser);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await UserModel.create({
            password: hashedPassword,
            nickName: nickName,
            image: req.file?.path ?? "uploads/anonymos.png",
        });
        //generate token
        const jwtKey = defaults.jwtKey;
        const token = jwt.sign({ userId: newUser.id, nickName: newUser.nickName }, jwtKey);
        newUser.dataValues.token = token;

        const { file } = req;
        if (file) {
            console.log("File:", file);
        }
        console.log("Body:", req.body);

        delete newUser.dataValues.password;

        res.status(200).json({ message: "Signup successful", user: newUser });
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Export the upload instance to be used in the router file
exports.upload = upload;

exports.me = async function (req, res) {
    try {
        const userId = req.user.userId;

        const user = await UserModel.findByPk(req.user.userId);
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
