const mongoose =
require("mongoose");
const revisionSchema =
new mongoose.Schema({
    userId:String,
    topic:String,
    priority:String,
    notes:String,
    lastRevisedDate:Date,
    nextRevisionDate:Date

});

module.exports =
mongoose.model(
"Revision",
revisionSchema

);