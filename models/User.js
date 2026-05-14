const mongoose =
require("mongoose");

const userSchema =
new mongoose.Schema({

    username:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    avatar:{
    type:String,
    default:"👩‍💻"

    },

    isVerified:{
    type:Boolean,
    default:false
    },

    otp:String,


});

module.exports =
mongoose.model(
    "User",
    userSchema
);