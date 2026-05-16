const { Queue } = require("bullmq")
const redis = require("./connection");

const testQueue = new Queue("demo-queue", {
    connection: redis,
});


module.exports = testQueue;


// FIFO

// FE -> BE (PDF Generation)

// BE -> task(Job) -> ID send to FE, PDF generation -> Queue (Producer)


// Worker - 

// bullMQ -> Bull Message Queue
// Redis -> In-memory datastore which is Re
