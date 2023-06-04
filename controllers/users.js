const multer = require("multer");
const path = require("path");

// Define multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        console.log("🚀 ~ file: users.js:10 ~ file:", file);
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

// Define the signup route handler
exports.signup = function (req, res) {
    console.log("🚀 ~ file: users.js:25 ~ res:", res);

    const { file } = req;
    console.log("File:", file);
    console.log("Body:", req.body);
    res.status(200).json({ message: "Signup successful." });
};

// Export the upload instance to be used in the router file
exports.upload = upload;
