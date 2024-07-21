
///get info from env file
require("dotenv").config();


module.exports = {
  ENV: process.env.NODE_ENV || "production", // Use environment variable or default to 'development'

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
      HOST: process.env.RDS_HOST,
      PORT: 3306,
      USERNAME: process.env.RDS_USER,
      PASSWORD:process.env.RDS_PASS,
      NAME: "betDonk",
      MAX_POOL: 100,
      MIN_POOL: 10,
      ACQUIRE: 30000,
      IDLE: 10000,
    },
  },
};
 
