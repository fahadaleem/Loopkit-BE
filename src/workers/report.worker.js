require('dotenv').config();

const { Worker, UnrecoverableError } = require("bullmq");
const { redis } = require("../config/redis");
const InterviewReportModel = require("../models/interviewReport.model");
const connectDB = require("../config/database");
const { generateReportForInterview } = require("../services/ai.service");

connectDB();

const reportWorker = new Worker("report-queue", async (job) => {
    const { interviewReportId } = job.data;

    const interviewReport = await InterviewReportModel.findById(interviewReportId);
    if (!interviewReport) {
        // The doc was deleted between enqueue and processing — no point retrying.
        throw new UnrecoverableError("Interview report not found");
    }

    const report = await generateReportForInterview(
        interviewReport.resume,
        interviewReport.jobDescription,
        interviewReport.selfDescription,
    );

    const updated = await InterviewReportModel.findByIdAndUpdate(
        interviewReportId,
        { ...report, status: "completed", error: null },
        { returnDocument: "after" },
    );

    return updated;
}, { connection: redis });


reportWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});


reportWorker.on("failed", async (job, error) => {
    if (!job) {
        console.error(`A job failed without a job reference: ${error?.message}`);
        return;
    }

    const attempts = job.opts?.attempts ?? 1;
    const attemptsMade = job.attemptsMade ?? 0;
    const isUnrecoverable = error?.name === "UnrecoverableError";
    const isFinalAttempt = isUnrecoverable || attemptsMade >= attempts;

    console.log(
        `Job ${job.id} attempt ${attemptsMade}/${attempts} failed: ${error?.message}`,
    );

    if (!isFinalAttempt) return;

    try {
        await InterviewReportModel.findByIdAndUpdate(job.data.interviewReportId, {
            status: "failed",
            error: error?.message ?? "Unknown error",
        });
    } catch (dbErr) {
        console.error(
            `Job ${job.id}: could not mark report ${job.data.interviewReportId} as failed: ${dbErr?.message}`,
        );
    }
});
