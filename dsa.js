const methodOverride = require("method-override");
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
app.use(methodOverride("_method"));

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/add-Question",(req,res)=>{
    res.render("addQuestion");
});


app.post("/add-Question",async(req,res)=>{
    const {title , difficulty, topic, description } = req.body;
    const newQuestion = new Question({
        title, difficulty, topic, description
    });
    await newQuestion.save();                 // mongodb save horha
    res.send("Question Added Successfully");
});


app.get("/Questions",async(req,res)=>{
    const allQuestions = await Question.find();
    const solvedQuestions = await Question.find({
        solved:true
    });
    const totalQuestions = allQuestions.length;
    const solvedCount = solvedQuestions.length;
    const progressPercentage = totalQuestions ===0 ? 0
    : Math.floor((solvedCount / totalQuestions) * 100);

    const easyCount = await Question.countDocuments({
    difficulty:"Easy"
});
    const mediumCount = await Question.countDocuments({
    difficulty:"Medium"
});
   const hardCount = await Question.countDocuments({
    difficulty:"Hard"
});

    res.render("questions",{
        allQuestions,
        totalQuestions,
        solvedCount,
        progressPercentage,
        easyCount,
        mediumCount,
        hardCount
    });
});


app.get("/questions/search", async (req, res) => {
    const searchedTopic = req.query.topic;
    const allQuestions = await Question.find({
        topic: searchedTopic
    });
    const solvedQuestions = allQuestions.filter((q) => q.solved);
    const totalQuestions = allQuestions.length;
    const solvedCount = solvedQuestions.length;
    const progressPercentage =
        totalQuestions === 0
        ? 0
        : Math.floor((solvedCount / totalQuestions) * 100);

    res.render("questions", {
        allQuestions,
        totalQuestions,
        solvedCount,
        progressPercentage
    });
});

app.get("/questions/difficulty/:level", async (req, res) => {

    const level = req.params.level;
    const allQuestions = await Question.find({
        difficulty: level
    });

    const solvedQuestions = allQuestions.filter((q) => q.solved);
    const totalQuestions = allQuestions.length;
    const solvedCount = solvedQuestions.length;
    const progressPercentage =
        totalQuestions === 0
        ? 0
        : Math.floor((solvedCount / totalQuestions) * 100);

    res.render("questions", {
        allQuestions,
        totalQuestions,
        solvedCount,
        progressPercentage
    });

});

app.get("/edit/:id", async(req,res)=>{
    const foundQuestion = await Question.findById(req.params.id);
    res.render("edit",{foundQuestion    
    });
});

app.delete("/delete/:id", async (req,res)=>{
    await Question.findByIdAndDelete(req.params.id);
    res.redirect("/questions");

});

app.put("/edit/:id", async(req,res)=>{
    await Question.findByIdAndUpdate(
        req.params.id,
        req.body
    );
    res.redirect("/questions");
});


app.patch("/toggle/:id", async(req,res)=>{
    const foundQuestion = await Question.findById(req.params.id);
    foundQuestion.solved = !foundQuestion.solved;
    await foundQuestion.save();
    res.redirect("/questions");
});

app.listen(3000,()=>{
    console.log("Server Started");
});