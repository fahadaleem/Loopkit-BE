const express = require("express");
const authUser = require("../middlewares/auth.middleware");
const upload = require("../middlewares/file.middleware");
const interviewController = require("../controllers/interview.controller");

const router = express.Router();


/*
    @route POST /api/interview/generate-report
    @desc Generate a report for the interview
    @access Private
*/

router.post("/generate-report", authUser, upload.single("resume"), interviewController.generateReport);


/*

    @route GET /api/interview/reports
    @desc Get all reports for the user
    @access Private
*/

router.get("/reports", authUser, interviewController.getAllReports);


/*
    @route GET /api/interview/:reportId
    @desc Get a specific report for the interview
    @access Private
*/

router.get("/:reportId", authUser, interviewController.getReportById);


/* 
    @route DELETE /api/interview/:reportId
    @desc Delete a specific report for the interview
    @access Private
*/

router.delete("/:reportId", authUser, interviewController.deleteReport);


/* 
    
    @route GET /api/interview/:reportId/pdf
    @desc Generate a resume PDF for the interview
    @access Private
*/

router.get("/:reportId/pdf", authUser, interviewController.getResumePdf);

module.exports = router;