const pdf = require('pdf-parse-new');
const { generateReportForInterview, generateResumePdf } = require("../services/ai.service");
const InterviewReportModel = require("../models/interviewReport.model");



/* 

    @route POST /api/interview/generate-report
    @desc Generate a report for the interview
    @access Private
*/

const generateReport = async (req, res) => {
    const resumeContent = await pdf(req.file.buffer);
    const { selfDescription, jobDescription } = req.body;

    const report = await generateReportForInterview(resumeContent.text, jobDescription, selfDescription);

    const interviewReport = await InterviewReportModel.create({
        ...report,
        user: req.user.id,
        resume: resumeContent.text,
        jobDescription: jobDescription,
        selfDescription: selfDescription,
    });

    return res.status(200).json({
        message: "Report generated successfully",
        interviewReport: {
            id: interviewReport._id,
            user: req.user.id,
            resume: resumeContent.text,
            jobDescription: jobDescription,
            selfDescription: selfDescription,
            ...report,
        }
    });

}

/* 
    @route GET /api/interview/:reportId
    @desc Get a specific report for the interview
    @access Private
*/

const getReportById = async (req, res) => {
    const { reportId } = req.params;
    const report = await InterviewReportModel.findById(reportId).lean();
    if (!report) {
        return res.status(400).json({ message: "Report not found" });
    }

    return res.status(200).json({
        message: "Report fetched successfully",
        interviewReport: {
            id: report._id,
            ...report,
        }
    });
}

/* 

    @route GET /api/interview/get-all-reports
    @desc Get all reports for the user
    @access Private
*/

const getAllReports = async (req, res) => {
    // pagination and limit
    const { page = 1, limit = 10, fields = "title,createdAt,matchScore" } = req.query;
    const fieldsArray = fields.split(",");
    const reports = await InterviewReportModel.find({ user: req.user.id }).select(fieldsArray).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const totalReports = await InterviewReportModel.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
        message: "Reports fetched successfully",
        reports: reports.map(report => ({
            id: report._id,
            ...report
        })),
        pagination: {
            totalReports: totalReports,
            totalPages: totalPages,
            currentPage: page,
            limit: limit,
        }
    });
}

/* 

    @route DELETE /api/interview/:reportId
    @desc Delete a specific report for the interview
    @access Private
*/


const deleteReport = async (req, res) => {
    const { reportId } = req.params;
    const report = await InterviewReportModel.findByIdAndDelete(reportId);
    if (!report) {
        return res.status(400).json({ message: "Report not found" });
    }
    return res.status(200).json({
        message: "Report deleted successfully"
    });
}



/* 

    @route GET /api/interview/pdf-resume
    @desc Generate a resume PDF for the interview
    @access Private
*/

const getResumePdf = async (req, res) => {
    const { reportId } = req.params;

    // Ownership-scoped lookup, with the binary explicitly selected
    // (atsResume.data has `select: false` on the schema).
    const report = await InterviewReportModel
        .findOne({ _id: reportId, user: req.user.id })
        .select('+atsResume.data');

    if (!report) {
        return res.status(404).json({ message: "Report not found" });
    }

    // Cached path — serve the stored buffer, no AI tokens spent.
    if (report.atsResume && report.atsResume.data) {
        res.set({
            'Content-Type': report.atsResume.contentType || 'application/pdf',
            'Content-Disposition': 'attachment; filename="ats-resume.pdf"',
        });
        return res.send(report.atsResume.data);
    }

    // Cold path — generate, persist on the report, then return.
    const pdfBuffer = await generateResumePdf(
        report.resume,
        report.jobDescription,
        report.selfDescription,
    );
    report.atsResume = {
        data: pdfBuffer,
        contentType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        generatedAt: new Date(),
    };
    await report.save();

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ats-resume.pdf"',
    });
    return res.send(pdfBuffer);
}



module.exports = {
    generateReport,
    getReportById,
    getAllReports,
    deleteReport,
    getResumePdf
}