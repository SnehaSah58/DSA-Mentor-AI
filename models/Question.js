const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    title: String,
    difficulty: String,
    topic: String,
    description: String
});

module.exports = mongoose.model("Question", questionSchema);