const jwt = require("jsonwebtoken");
const BlackList = require("../models/blacklist.model");

const authUser = async (req, res, next)=>{
    const userToken = req.cookies.token;
    if(!userToken) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const isTokenBlacklisted = await BlackList.findOne({ token: userToken });
    if(isTokenBlacklisted) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}


module.exports = authUser;