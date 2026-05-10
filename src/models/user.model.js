const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: [true, "Name must be unique"]
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email must be unique"]
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})


const User = mongoose.model("Users", UserSchema);

module.exports = User;