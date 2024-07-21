const { Sequelize } = require("sequelize");
const config = require("./config");
console.log("🚀 ~ config:", config)
const AWS = require("aws-sdk");
const env = config.ENV;
console.log("🚀 ~ env:", env)
require("dotenv").config();

const dbConfig = config.DB[env];
console.log("🚀 ~ dbConfig:", dbConfig)

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.AWS_ACCESS_KEY_ID,
  secretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY || config.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || config.AWS_REGION,
});

const sequelize = new Sequelize(
  dbConfig.NAME,
  dbConfig.USERNAME,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: "mysql",
    pool: {
      max: dbConfig.MAX_POOL,
      min: dbConfig.MIN_POOL,
      acquire: dbConfig.ACQUIRE,
      idle: dbConfig.IDLE,
    },
    logging: console.log,
  }
);
console.log(`Using ${env} configuration`);
// Log the AWS configuration
const s3 = new AWS.S3({
  region: process.env.AWS_REGION, // Ensure the region is specified here
});
console.log(`AWS Region: ${AWS.config.region}`);
// console.log('sequelize',sequelize)
module.exports = { s3, sequelize };
