const express = require("express");
const authController = require("../controllers/auth.controller");
const authUser = require("../middlewares/auth.middleware");
const router = express.Router();


/* 
    @route POST /api/auth/register
    @desc Register a new user
    @access Public
*/
router.post("/register", authController.registerUser);


/* @route POST /api/auth/login
    @desc Login a user
    @access Public
*/
router.post("/login", authController.loginUser);


/*
    @route POST /api/auth/logout
    @desc Logout a user
    @access Private
*/
router.get("/logout", authController.logoutUser);


/* 
    
    @route GET /api/auth/me
    @desc Get the current user
    @access Private
*/
router.get("/me",authUser, authController.getMe);

module.exports = router