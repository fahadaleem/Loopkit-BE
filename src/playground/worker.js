const { Worker } = require("bullmq");
const redis = require("./connection");

const worker = new Worker("demo-queue", async (job) => {
    console.log(`Got Job: ${JSON.stringify(job)}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    return "Done"
}, {
    connection: redis
});


worker.on("completed", (job, returnValue) => {
    console.log(`Job ${job.id} completed`);

    console.log(`Result: ${returnValue}`);
});