const multer = require("multer");
const path = require("path");
const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user");

// Define multer storage configuration
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
        const existingUser = await User.findOne({ where: { nickName } });
        // console.log("🚀 ~ file: users.js:43 ~ existingUser:", existingUser);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            password: hashedPassword,
            nickName: nickName,
            image: req.file.path ?? "user.png",
        });

        const { file } = req;
        console.log("File:", file);
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
