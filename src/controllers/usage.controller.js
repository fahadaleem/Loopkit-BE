const { perDayRateLimiter } = require("../config/dailyRateLimiter");
require('dotenv').config();

const DAILY_RATE_LIMIT = process.env.DAILY_RATE_LIMIT;

async function getUsage(req, res) {
    const { id } = req.user;
    const result = await perDayRateLimiter.get(id);
    return res.status(200).json({
        message: "Usage fetched successfully", usage: {
            limit: Number(DAILY_RATE_LIMIT),
            used: Number(DAILY_RATE_LIMIT) - result.remainingPoints,
            remaining: result.remainingPoints,
            reset: new Date(Math.ceil((Date.now() + result.msBeforeNext) / 1000) * 1000),
        }
    });
}

module.exports = { getUsage };