const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({

    topic:{
        type:String,
        required:true
    },

    goalDays:{
        type:Number,
        required:true
    },

    startDate:{
        type:Date,
        default:Date.now
    },

    endDate:{
        type:Date
    },

    completed:{
    type:Boolean,
    default:false
    },

    userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
    }

});

module.exports = mongoose.model(
    "Goal",
    goalSchema
);