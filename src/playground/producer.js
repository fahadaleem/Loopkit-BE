const testQueue = require("./queue");

const producer = async () =>{
    await testQueue.add("test-job", { message: "Adding new job again to test" },  {
        removeOnComplete: true,
        removeOnFail: true
    });
    console.log("Job added to the queue");
}

producer();

// {"test-job": {
//     message: "Adding new job again to test"
// }}