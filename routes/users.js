const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        console.log("🚀 ~ file: users.js:11 ~ req:", req);
        let ext = path.extname(file.originalname);
        let fileName = path.basename(file.originalname, ext);
        cb(null, fileName + "-" + Date.now() + ext);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
});

router.post("/", upload.single("image"), (req, res) => {
    const { file } = req;
    console.log("kk", file);
    console.log("dd", req.body);
    res.json({ message: "File uploaded successfully" });
});

module.exports = router;
