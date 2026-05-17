const { Worker } = require("bullmq");
const { redis } = require("../config/redis");
const connectDB = require("../config/database");
const { generateResumePdf } = require("../services/ai.service");
const InterviewReportModel = require("../models/interviewReport.model");

connectDB();

const resumeWorker = new Worker("resume-queue", async (job) => {
    const { reportId } = job.data;
    const report = await InterviewReportModel.findById(reportId);
    if (!report) {
        throw new Error("Report not found");
    }
    const pdfBuffer = await generateResumePdf(report.resume, report.jobDescription, report.selfDescription);


    const updated = await InterviewReportModel.findByIdAndUpdate(reportId, {
        atsResume: {
            data: pdfBuffer,
            contentType: 'application/pdf',
            sizeBytes: pdfBuffer.length,
            generatedAt: new Date(),
        }
    }, { returnDocument: "after" });
    return updated;
}, {
    connection: redis
})


resumeWorker.on("completed", (job, data) => {
    console.log(`Resume generated successfully for report ${job.data.reportId}`);
});
module.exports = resumeWorker;