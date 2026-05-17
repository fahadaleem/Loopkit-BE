const { redis } = require("../config/redis");
const { Queue } = require("bullmq");

const resumeQueue = new Queue("resume-queue", {
    connection: redis, 
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
    },
});

module.exports = resumeQueue;