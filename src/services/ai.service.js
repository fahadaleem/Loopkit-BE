const { GoogleGenAI } = require("@google/genai");
const puppeteer = require("puppeteer");
const { z } = require("zod");
const path = require("path");
const os = require("os");


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});


// Build a JSON Schema and strip fields Gemini's responseJsonSchema rejects.
// Uses Zod 4's built-in toJSONSchema (the standalone `zod-to-json-schema`
// package is broken with Zod 4 — it emits an empty schema).
function toGeminiJsonSchema(zodSchema) {
    const schema = z.toJSONSchema(zodSchema);
    delete schema.$schema;
    return schema;
}


const reportSchema = z.object({
    title: z.string().describe("The job title for which the interview report is generated"),
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("A technical question that may be asked in the interview"),
        intention: z.string().describe("Why the interviewer would ask this question"),
        answer: z.string().describe("How to answer this question — points to cover, approach to take")
    })).describe("Technical questions tailored to the role"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("A behavioral question that may be asked in the interview"),
        intention: z.string().describe("Why the interviewer would ask this question"),
        answer: z.string().describe("How to answer this question — points to cover, approach to take")
    })).describe("Behavioral questions tailored to the role"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("A skill the candidate is lacking relative to the job description"),
        severity: z.enum(["low", "medium", "high"]).describe("How impactful this gap is on the candidate's chances")
    })).describe("Gap analysis between the resume and the job description"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("Day number in the preparation plan, starting from 1"),
        focus: z.string().describe("Main focus for this day (e.g. data structures, system design, mock interviews)"),
        tasks: z.array(z.string()).describe("Concrete tasks to complete on this day")
    })).describe("Day-wise preparation plan to follow before the interview"),
});


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


const generateReportForInterview = async (resume, jobDescription, selfDescription) => {
    const prompt = `You are an expert interview coach. Generate a thorough interview prep report for the candidate based on the inputs below.

Resume:
${resume}

Job description:
${jobDescription}

Candidate self-description:
${selfDescription}`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: toGeminiJsonSchema(reportSchema)
        }
    });

    const parsed = JSON.parse(response.text);
    return reportSchema.parse(parsed);
}



const generateResumePdf = async (resume, jobDescription, selfDescription) => {
    const resumePdfSchema = z.object({
        resume: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer, wkhtmltopdf, etc."),
    });

    const prompt = `You are an expert resume writer and ATS (Applicant Tracking System) optimization specialist. Generate a tailored, ATS-optimized resume in clean HTML format that matches the EXACT structural template specified below, ready for PDF conversion.

            ═══════════════════════════════════════
            INPUTS
            ═══════════════════════════════════════

            <existing_resume>
            ${resume}
            </existing_resume>

            <job_description>
            ${jobDescription}
            </job_description>

            <candidate_self_description>
            ${selfDescription}
            </candidate_self_description>

            ═══════════════════════════════════════
            REQUIRED RESUME STRUCTURE (FOLLOW EXACTLY)
            ═══════════════════════════════════════

            1. HEADER — Single-column, fully centered (NOT two-column)
            - Line 1: Full Name — font-size: 24pt, font-weight: bold, text-align: center, margin: 0, line-height: 1.1
            - Line 2: Professional Title (e.g., "Full Stack Developer") — font-size: 12pt, font-weight: normal, text-align: center, margin-top: 4px
            - Line 3: Contact info on a SINGLE LINE separated by " • " (bullet character with spaces) — font-size: 10pt, text-align: center, margin-top: 6px
                • Order: Email • Phone • LinkedIn • GitHub • Website
                • Hyperlinks should have color: #000 and text-decoration: none.
                • Only include items that exist in the input — skip missing fields
            - margin-bottom: 12px under the entire header
            - NO border around header, NO background color

            2. SUMMARY
            - Heading "SUMMARY" — uppercase, bold, 11pt, with border-bottom: 1px solid #000, padding-bottom: 2px, margin-top: 14px, margin-bottom: 6px
            - 2-3 sentence paragraph, font-size: 10.5pt, line-height: 1.4, text-align: left

            3. WORK EXPERIENCE
            - Heading "WORK EXPERIENCE" — same styling as SUMMARY heading
            - If the candidate has no professional roles in the source resume, replace this section with a PROJECTS section using the same three-column row structure (Project name | Tech stack | Date Range).
            - Wrap each job entry in <div class="job-entry">…</div> so it never splits across pages (uses the .job-entry CSS class defined below).
            - Each job entry uses TWO three-column grid rows:

            ROW 1 (CRITICAL — use exact CSS):
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                align-items: baseline;
                • Cell 1 (text-align: left): <strong>[Job Title]</strong>
                • Cell 2 (text-align: center): <strong>[Company Name]</strong>
                • Cell 3 (text-align: right): [Date Range — format "Mon YYYY – Mon YYYY" with an en-dash; use "Present" (capitalized) for current roles, e.g., "Jan 2026 – Present"]

            ROW 2 (same grid CSS, smaller font):
                • Cell 1 (text-align: left): [Team/Squad name]
                • Cell 2 (text-align: center): [City, Country]
                • Cell 3 (text-align: right): [Work Mode: Remote/Hybrid/Onsite]

            - Bulleted achievements using <ul> with padding-left: 18px, margin: 4px 0:
                • Each <li> starts with strong action verb
                • Wrap key impact phrase or metric in <strong> tags
                • Example: "Saved <strong>USD 10M in annual revenue</strong> by implementing..."
                • font-size: 10.5pt, line-height: 1.35, margin-bottom: 2px
            - Bullet count: 3–6 bullets for the most recent 1–2 roles; 1–3 bullets for older or less-relevant roles.
            - Footer line per job: "<strong>Tools and Technologies:</strong> [comma-separated list]" — omit this line entirely if the source resume doesn't list tools for the role; do not infer.
            - margin-bottom between jobs: 10px

            4. EDUCATION
            - Heading "EDUCATION" — same heading style
            - Same three-column grid structure as work experience:
                ROW 1: [Degree] | [University Name] | [Date Range]
                ROW 2: [CGPA: X.XX] | [Country] | (leave empty if no third value)
            - Optional bullets for projects/achievements
            - Optional "Relevant coursework:" footer line — only include if explicitly listed in the source resume.

            5. SKILLS
            - Heading "SKILLS" — same heading style
            - Use <ul> with bulleted items:
                • <strong>Languages:</strong> [list]
                • <strong>Technologies:</strong> [list]
                • <strong>Engineering:</strong> [list]
                • <strong>Other:</strong> [soft skills]

            ═══════════════════════════════════════
            EXACT CSS TEMPLATE (USE AS BASELINE)
            ═══════════════════════════════════════

            body {
                font-family: 'Calibri', 'Arial', sans-serif;
                font-size: 10.5pt;
                color: #000;
                background: #fff;
                margin: 0.5in;
                line-height: 1.35;
            }
            .header {
                text-align: center;
                margin-bottom: 12px;
            }
            .name {
                font-size: 24pt;
                font-weight: bold;
                margin: 0;
                line-height: 1.1;
            }
            .title {
                font-size: 12pt;
                margin-top: 4px;
            }
            .contact {
                font-size: 10pt;
                margin-top: 6px;
            }
            .contact a {
                color: #000;
                text-decoration: none;
            }
            .section-heading {
                font-size: 11pt;
                font-weight: bold;
                text-transform: uppercase;
                border-bottom: 1px solid #000;
                padding-bottom: 2px;
                margin-top: 14px;
                margin-bottom: 6px;
            }
            .job-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                align-items: baseline;
            }
            .job-row .left { text-align: left; }
            .job-row .center { text-align: center; }
            .job-row .right { text-align: right; }
            .job-meta { font-size: 10pt; margin-bottom: 4px; }
            ul { margin: 4px 0; padding-left: 18px; }
            li { margin-bottom: 2px; line-height: 1.35; }
            .tools { margin-top: 4px; margin-bottom: 10px; font-size: 10.5pt; }
            .job-entry { page-break-inside: avoid; margin-bottom: 10px; }

            ═══════════════════════════════════════
            HEADER HTML EXAMPLE (FOLLOW THIS PATTERN)
            ═══════════════════════════════════════

            <div class="header">
            <div class="name">Muhammad Fahad Aleem</div>
            <div class="title">Full Stack Developer</div>
            <div class="contact">
                faleem396@gmail.com • +92-3162036048 •
                <a href="https://linkedin.com/in/username">linkedin.com/in/username</a> •
                <a href="https://github.com/username">github.com/username</a> •
                <a href="https://website.com">website.com</a>
            </div>
            </div>

            ═══════════════════════════════════════
            CONTENT RULES
            ═══════════════════════════════════════

            1. ATS OPTIMIZATION
            - Extract hard skills, tools, certifications, and qualifications from the job description
            - Mirror exact JD terminology (don't substitute "JS" for "JavaScript" if JD says "JavaScript")
            - Reorder skills and bullets by JD relevance
            - Naturally weave keywords into SUMMARY and SKILLS

            2. ACHIEVEMENT-FOCUSED BULLETS
            - Formula: [Strong Action Verb] + [What you did] + [Quantifiable impact]
            - Bold the metric or impact phrase using <strong> tags inside each bullet
            - One concise bullet, max 2 lines (~25 words)
            - If no metric exists, bold the strongest qualitative outcome

            3. ANTI-HALLUCINATION (CRITICAL)
            - Do NOT fabricate companies, dates, degrees, metrics, or technologies
            - Preserve all factual data exactly as provided
            - Only rephrase, reorder, and re-emphasize — never invent
            - If candidate self-description conflicts with resume, trust the resume
            - Use self-description only for tone, target role emphasis, and bullet ordering — never as a source of factual claims (companies, dates, metrics)

            4. PRIORITIZATION
            - Reverse chronological order (most recent first)
            - JD-relevant bullets first within each role
            - Drop or condense clearly irrelevant bullets

            ═══════════════════════════════════════
            CRITICAL ANTI-AI-DETECTION RULES
            ═══════════════════════════════════════

            BANNED PHRASES (do not use any of these in any bullet or summary):
            - "seamless"
            - "robust"
            - "cutting-edge"
            - "enhanced [anything] and [anything]"
            - "significantly improving"
            - "ensuring [abstract noun] and [abstract noun]"
            - "contributing to enhanced"
            - "leveraging modern"
            - "collaborative team player"
            - "proactive approach"
            - "commitment to continuous growth"
            - "eager to contribute"
            - "user engagement" (unless metric is provided)

            MANDATORY BULLET STRUCTURE:
            Each bullet MUST contain ONE of the following:
            1. A hard number (%, $, count, time, scale) — e.g., "reduced by 40%"
            2. A specific technical artifact — e.g., "OAuth2 token refresh service handling 50K req/min"
            3. A specific feature/product name — e.g., "the Stripe billing integration"

            If the input does NOT contain a hard number for a bullet, DO NOT invent one. Instead:
            - Bold the technical artifact (e.g., "<strong>OAuth2 token refresh service</strong>")
            - If a role has no metrics or specific artifacts, keep its 1–2 strongest bullets and bold the most concrete noun phrase in each — only drop bullets that are both vague AND uninformative

            OUTPUT FORMAT FIXES:
            - NEVER use markdown asterisks (**text**) — always use <strong>text</strong>
            - ALWAYS render bullets via <ul><li> with visible disc markers
            - ALWAYS include full URLs in contact line, not just "LinkedIn" / "GitHub"
            • Format: <a href="https://linkedin.com/in/username">linkedin.com/in/username</a>
            • This is REQUIRED for ATS link extraction

            SUMMARY RULES:
            - 2-3 sentences MAXIMUM
            - Lead with years of experience + primary stack
            - One concrete differentiator (a niche skill, a product domain, a scale metric)
            - NO closing line about being "eager", "passionate", "collaborative", or "committed"

            ═══════════════════════════════════════
            OUTPUT FORMAT
            ═══════════════════════════════════════

            Schema:
            {
            "resume": "<!DOCTYPE html><html lang=\\"en\\"><head><meta charset=\\"UTF-8\\"><title>Resume - [Name]</title><style>/* full CSS */</style></head><body>...</body></html>"
            }

            The HTML must be a complete, self-contained document with all CSS inline in a single <style> block — ready to pass directly to Puppeteer/Playwright/wkhtmltopdf.


            Generate the resume HTML now.`;

    const htmlResumeResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: toGeminiJsonSchema(resumePdfSchema)
        }
    });
    const parsed = JSON.parse(htmlResumeResponse.text);
    return generateResumeFromHtmlToPdf(parsed.resume);
}



module.exports = {
    generateReportForInterview,
    generateResumePdf
}
