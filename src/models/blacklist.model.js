const mongoose = require("mongoose");

const blackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const BlackList = mongoose.model("BlackList", blackListSchema);

module.exports = BlackList;