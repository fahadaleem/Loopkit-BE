const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");5
const usageController = require("../controllers/usage.controller");

/* 
    @route GET /api/usage/me
    @desc Get the current user's usage
    @access Private
*/
router.get("/me", authMiddleware, usageController.getUsage);

module.exports = router;