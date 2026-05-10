const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    title: String,
    difficulty: String,
    topic: String,
    description: String,

    solved:{
    type : Boolean,
    default : false
    },

    notes:{
        type:String,
        default:" "
    },

    revisionPriority:{
        type:String,
        default:"Low"
    },

    lastRevised:{
        type:Date,
        default:Date.now
    },

    nextRevisionDate:{
        type:Date,
        default:Date.now
    },
});

module.exports = mongoose.model("Question", questionSchema);