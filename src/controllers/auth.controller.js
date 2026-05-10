const BlackList = require("../models/blacklist.model");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const NODE_ENV = process.env.NODE_ENV;

// Cross-site cookies (vercel.app → onrender.com) require SameSite=None + Secure.
// Locally we keep SameSite=Lax + non-Secure so dev over plain http still works.
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
};

/*
    @route POST /api/auth/register
    @desc Register a new user
    @access Public
*/
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const isUserAlreadyExist = await User.findOne({
        $or: [{ name }, { email }]
    });

    if (isUserAlreadyExist) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashPassword });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, { ...COOKIE_OPTIONS, maxAge: 3600000 });

    return res.status(201).json({
        message: "User created successfully", user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
}


/*
    @route POST /api/auth/login
    @desc Login a user
    @access Public
*/
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, { ...COOKIE_OPTIONS, maxAge: 3600000 });

    return res.status(200).json({
        message: "Login successful", user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
}


/*

    @route POST /api/auth/logout
    @desc Logout a user
    @access Public
*/

const logoutUser = async (req, res) => {
    const userToken = req.cookies.token;

    if (!userToken) {
        return res.status(400).json({ message: "Unauthorized" });
    }

    const token = await BlackList.create({ userToken });
    res.clearCookie("token", COOKIE_OPTIONS);

    return res.status(200).json({ message: "Logout successful" });
}

/*

    @route GET /api/auth/me
    @desc Get the current user
    @access Private
*/

const getMe = async (req, res) => {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    return res.status(200).json({
        message: "User fetched successfully", user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe
}