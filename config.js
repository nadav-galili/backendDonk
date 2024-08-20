
///get info from env file
require("dotenv").config();


console.log("process.env.RDS_HOST", process.env.NODE_ENV);
module.exports = {
  ENV: process.env.NODE_ENV || "development", // Use environment variable or default to 'development'

  DB: {
    development: {
      HOST: "127.0.0.1",
      PORT: 8889,
      USERNAME: "root",
      PASSWORD: "root",
      NAME: "betdonk",
      MAX_POOL: 50,
      MIN_POOL: 2,
      ACQUIRE: 30000,
      IDLE: 10000,
    },
    production: {
      HOST: process.env.FREE_HOST,
      PORT: process.env.FREE_PORT,
      USERNAME: process.env.FREE_USER,
      PASSWORD:process.env.FREE_PASS,
      NAME: "betDonk",
      MAX_POOL: 100,
      MIN_POOL: 10,
      ACQUIRE: 30000,
      IDLE: 10000,
    },
  },
};
 
