const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    title: String,
    difficulty: String,
    topic: String,
    description: String,

    solved:{
    type : Boolean,
    default : false
}

});

module.exports = mongoose.model("Question", questionSchema);