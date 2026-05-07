const Question = require("./models/Question");
const mongoose = require("mongoose");
const express = require ("express");
const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/dsaMentor")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

app.set("view engine" , "ejs");
app.use(express.urlencoded({extended: true}));   //for read data

app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("home");
});

app.listen(3000,()=>{
    console.log("Server Started");
});