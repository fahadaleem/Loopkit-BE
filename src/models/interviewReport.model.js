const mongoose = require("mongoose");

const TechnicalQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
    intention: {
        type: String,
    }
}, {
    _id: false
})


const BehavioralQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
    intention: {
        type: String,
    }
}, {
    _id: false
})

const SkillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
    },
   severity: {
    type: String,
    enum: ["low", "medium", "high"],
   }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
    },
    focus: {
        type: String,
    },
    tasks: [ {
        type: String,
    } ]
})


const atsResume = new mongoose.Schema({
    data: {
        type: Buffer, 
        select: false
    }, 
    contentType: {
        type: String,
    },
    sizeBytes: {
        type: Number,
    },
    generatedAt:{
        type: Date,
        default: Date.now
    },
}, {
    _id: false
})


const InterviewReportSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    jobDescription: {
        type: String,
        required: [true, "Job description is required"]
    },
    resume: {
        type: String
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestions: [ TechnicalQuestionsSchema ],
    behavioralQuestions: [ BehavioralQuestionsSchema ],
    skillGaps: [ SkillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"]
    },
    atsResume: {
        type: atsResume
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        required: [true, "Status is required"]
    },
    error: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})


const InterviewReport = mongoose.model("Reports", InterviewReportSchema);

module.exports = InterviewReport;