const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateInterviewReportWithGroq = async (resume, jobDescription, selfDescription) => {


    const responseFormat = {
        type: "json_object",
        schema: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The job title for which the interview report is generated"
                },
                matchScore: {
                    type: "number",
                    description: "A score between 0 and 100 indicating match quality"
                },
                technicalQuestions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            question: { type: "string" },
                            intention: { type: "string" },
                            answer: { type: "string" }
                        },
                        required: ["question", "intention", "answer"],
                        additionalProperties: false
                    }
                },
                behavioralQuestions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            question: { type: "string" },
                            intention: { type: "string" },
                            answer: { type: "string" }
                        },
                        required: ["question", "intention", "answer"],
                        additionalProperties: false
                    }
                },
                skillGaps: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            skill: { type: "string" },
                            severity: {
                                type: "string",
                                enum: ["low", "medium", "high"]
                            }
                        },
                        required: ["skill", "severity"],
                        additionalProperties: false
                    }
                },
                preparationPlan: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            day: { type: "number" },
                            focus: { type: "string" },
                            tasks: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: ["day", "focus", "tasks"],
                        additionalProperties: false
                    }
                }
            },
            required: [
                "title",
                "matchScore",
                "technicalQuestions",
                "behavioralQuestions",
                "skillGaps",
                "preparationPlan"
            ],
            additionalProperties: false
        }
    };


    const prompt = `You are an expert interview coach and career analyst. Your task is to analyze a candidate's resume, the job description they are targeting, and their own self-description, and produce a detailed interview preparation report.

    CRITICAL OUTPUT RULES:
    - Respond with ONLY a valid JSON object.
    - Do NOT wrap the JSON in markdown code fences (no \`\`\`json, no \`\`\`).
    - Do NOT include any prose, explanation, preamble, or commentary before or after the JSON.
    - The JSON must exactly match the structure shown in the example below.
    - All required fields must be present. Do not add fields that are not in the example.
    
    FIELD REQUIREMENTS:
    - "title": string. The job title from the job description.
    - "matchScore": number between 0 and 100 (inclusive). How well the candidate matches the role.
    - "technicalQuestions": array of at least 5 objects. Each object has:
        - "question": string. A realistic technical interview question for this role.
        - "intention": string. Why an interviewer would ask this question — what they are evaluating.
        - "answer": string. A strong sample answer the candidate could give, tailored to their background.
    - "behavioralQuestions": array of at least 3 objects. Same shape as technicalQuestions, but for behavioral/soft-skill questions.
    - "skillGaps": array of objects. Each object has:
        - "skill": string. A specific skill the candidate is missing or weak in for this role.
        - "severity": string. Must be exactly one of: "low", "medium", "high".
    - "preparationPlan": array of objects representing a day-by-day plan. Each object has:
        - "day": number. Day index starting at 1.
        - "focus": string. The theme or main topic for that day.
        - "tasks": array of strings. Specific, actionable tasks for that day.
    
    EXAMPLE OUTPUT (structure only — generate real content based on the actual inputs):
    {
      "title": "Senior Frontend Engineer",
      "matchScore": 78,
      "technicalQuestions": [
        {
          "question": "How would you optimize the performance of a React application that re-renders too often?",
          "intention": "Tests the candidate's understanding of React's render cycle, memoization, and profiling tools.",
          "answer": "I would start by profiling with React DevTools to identify the components re-rendering unnecessarily. Then I would apply React.memo for pure components, useMemo and useCallback for expensive computations and stable callback references, and review state placement to ensure state lives at the lowest level it needs to."
        },
        {
          "question": "Explain how you would design a scalable component library.",
          "intention": "Evaluates architectural thinking, API design, and awareness of reusability and maintainability.",
          "answer": "I would establish design tokens for consistency, build primitives first (Button, Input, etc.), enforce strict TypeScript prop contracts, document with Storybook, and version with semantic releases so consumers can upgrade safely."
        }
      ],
      "behavioralQuestions": [
        {
          "question": "Tell me about a time you disagreed with a teammate on a technical decision.",
          "intention": "Assesses communication, conflict resolution, and ability to collaborate under disagreement.",
          "answer": "On a recent project, I disagreed with a teammate about using Redux vs Context. I asked for time to write a short comparison doc with tradeoffs. We met to discuss it, agreed on Context for that specific feature's scope, and documented the reasoning. I learned that surfacing tradeoffs in writing reduces friction."
        }
      ],
      "skillGaps": [
        { "skill": "Server-side rendering with Next.js", "severity": "medium" },
        { "skill": "Web accessibility (WCAG)", "severity": "low" }
      ],
      "preparationPlan": [
        {
          "day": 1,
          "focus": "React fundamentals and performance",
          "tasks": [
            "Review React rendering lifecycle and reconciliation",
            "Practice 3 questions on useMemo, useCallback, and React.memo",
            "Build a small demo showing before/after of a performance optimization"
          ]
        },
        {
          "day": 2,
          "focus": "System design for frontend",
          "tasks": [
            "Read about component library architecture",
            "Sketch a design for a reusable form library",
            "Practice explaining the design out loud in 5 minutes"
          ]
        }
      ]
    }
    
    NOW PROCESS THE FOLLOWING INPUTS AND PRODUCE THE JSON REPORT:
    
    Resume:
    ${resume}
    
    Job Description:
    ${jobDescription}
    
    Candidate Self-Description:
    ${selfDescription}`


    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: responseFormat
    });
    const responseObject = {
        metadata: {
            model: "llama-3.3-70b-versatile",
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
        },
        report: JSON.parse(response.choices[0].message.content)
    }
    return responseObject;
}



const generateResumePdfWithGroq = async (resume, jobDescription, selfDescription) => {

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


            Generate the resume HTML now with the JSON schema provided above.`;



    const responseFormat = {
        type: "json_object",
        schema: {
            type: "object",
            properties: {
                resume: { type: "string", description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer, wkhtmltopdf, etc." }
            },
            required: ["resume"],
            additionalProperties: false
        }
    };

    const resumeResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: responseFormat
    });

    const resumeResponseObject = {
        metadata: {
            model: "llama-3.3-70b-versatile",
            inputTokens: resumeResponse.usage.prompt_tokens,
            outputTokens: resumeResponse.usage.completion_tokens,
            totalTokens: resumeResponse.usage.total_tokens,
        },
        resume: JSON.parse(resumeResponse.choices[0].message.content).resume
    }
    return resumeResponseObject;


}

module.exports = { generateInterviewReportWithGroq, generateResumePdfWithGroq };