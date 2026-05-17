const {redis} = require("./redis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
require('dotenv').config();

const DAILY_RATE_LIMIT = process.env.DAILY_RATE_LIMIT;


const perDayRateLimiter = new RateLimiterRedis({
    prefix: "loopkit:reports:daily",
    storeClient: redis, 
    points: Number(DAILY_RATE_LIMIT),
    duration: 86400, // 1 day
});

module.exports = { perDayRateLimiter };