const { Queue } = require("bullmq")

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: 6379
}

const videoQueue = new Queue("video-processing", { connection })

module.exports = videoQueue
