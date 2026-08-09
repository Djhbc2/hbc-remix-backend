const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "default",
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.STORAGE_BUCKET;

module.exports = { s3, BUCKET };
