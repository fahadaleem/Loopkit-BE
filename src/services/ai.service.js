const { generateInterviewReportWithGemini } = require("./gemini.service");
const { generateInterviewReportWithGroq, generateResumePdfWithGroq } = require("./groq.service");
const puppeteer = require("puppeteer");
const path = require("path");
const os = require("os");

// Fallback providers
const interviewReportProviders = [
    generateInterviewReportWithGemini,
    generateInterviewReportWithGroq
]

const resumeProviders = [
    generateResumePdfWithGroq
]


const generateResumeFromHtmlToPdf = async (html) => {
    const browser = await puppeteer.launch({
        headless: "shell",
        timeout: 60000,
        userDataDir: path.join(os.tmpdir(), "puppeteer-resume-profile"),
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
        ],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBytes = await page.pdf({ format: "A4", margin: { top: "5mm", right: "5mm", bottom: "5mm", left: "5mm" } });
        // Newer Puppeteer returns Uint8Array; Mongoose's Buffer schema type
        // can't cast Uint8Array, so normalise to a Node Buffer here.
        return Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
    } finally {
        await browser.close();
    }
}


const generateInterviewReport = async (resume, jobDescription, selfDescription) => {
    for (const provider of interviewReportProviders) {
        try {
            const report = await provider(resume, jobDescription, selfDescription);
            if (report) {
                return report;
            }
        } catch (error) {
            console.error(error);
        }
    }

    throw new Error("No provider found to generate interview report");
}

const generateResumePdf = async (resume, jobDescription, selfDescription) => {
    for (const provider of resumeProviders) {
        try {
            const resumeResponse = await provider(resume, jobDescription, selfDescription);
            if (resumeResponse.resume) {
                return generateResumeFromHtmlToPdf(resumeResponse.resume);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = { generateInterviewReport, generateResumePdf };