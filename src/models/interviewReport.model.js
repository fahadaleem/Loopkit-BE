const mongoose = require("mongoose");

const TechnicalQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    }
}, {
    _id: false
})


const BehavioralQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    }
}, {
    _id: false
})

const SkillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"]
    },
   severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: [true, "Severity is required"]
   }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ {
        type: String,
        required: [ true, "Task is required" ]
    } ]
})


const atsResume = new mongoose.Schema({
    data: {
        type: Buffer, 
        select: false
    }, 
    contentType: {
        type: String,
        required: [true, "Content type is required"]
    },
    sizeBytes: {
        type: Number,
        required: [true, "Size in bytes is required"]
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
        required: [true, "Title is required"]
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
    }
}, {
    timestamps: true
})


const InterviewReport = mongoose.model("Reports", InterviewReportSchema);

module.exports = InterviewReport;