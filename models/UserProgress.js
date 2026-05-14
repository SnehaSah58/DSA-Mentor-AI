const mongoose =
require("mongoose");

const userProgressSchema =
new mongoose.Schema({

    userId:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User"
    },

    questionId:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"Question"

    },

    solved:{
        type:Boolean,
        default:false
    },

    notes:{
        type:String,
        default:""
    },


    revisionPriority:{
        type:String,
        default:"Low"
    },

    lastRevised:{
        type:Date
    }

});

module.exports =
mongoose.model(
"UserProgress",
userProgressSchema
);