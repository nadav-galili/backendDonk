const { Sequelize } = require("sequelize");
const config = require("./config");
const AWS = require("aws-sdk");

const env = config.ENV;
const dbConfig = config.DB[env];

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.AWS_ACCESS_KEY_ID,
  secretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY || config.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || config.AWS_REGION,
});

let dialectOptions = {};
if (dbConfig.USE_SSL) {
  dialectOptions.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA,
  };
}

const sequelize = new Sequelize(
  dbConfig.NAME,
  dbConfig.USERNAME,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: "mysql",
    dialectOptions: dialectOptions,
    pool: {
      max: dbConfig.MAX_POOL,
      min: dbConfig.MIN_POOL,
      acquire: dbConfig.ACQUIRE,
      idle: dbConfig.IDLE,
    },
    logging: false,
  }
);

console.log(`Using ${env} configuration`);

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

console.log(`AWS Region: ${AWS.config.region}`);

module.exports = { s3, sequelize };
