const { perDayRateLimiter } = require("../config/dailyRateLimiter");

const ratelimitMiddleware = async (req, res, next) => {
    const { id } = req.user;
    try {
        const perDayResult = await perDayRateLimiter.consume(id);
        res.setHeader("X-RateLimit-Per-Day-Limit", perDayResult.consumedPoints);
        res.setHeader("X-RateLimit-Per-Day-Remaining", perDayResult.remainingPoints);
        res.setHeader("X-RateLimit-Per-Day-Reset", perDayResult.msBeforeNext);
    } catch (error) {
        console.log(error)
        return res.status(429).json({ message: "Rate limit exceeded" });
    }
    next();
}


module.exports = ratelimitMiddleware