const Goal = require("./models/Goal")
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
    const activeGoals = await Goal.find({
    completed:false
});

const completedGoals = await Goal.find({
    completed:true
});
    const topicStats = {};
    allQuestions.forEach((q)=>{
    if(!topicStats[q.topic]){
        topicStats[q.topic] = 0;
    }
    if(q.solved){
        topicStats[q.topic]++;
    }
});

    let weakTopic = "";
    let minimumSolved = Infinity;
    for(let topic in topicStats){
    if(topicStats[topic] < minimumSolved){
        minimumSolved = topicStats[topic];
        weakTopic = topic;
    }
}

    let strongTopic = "";
    let maximumSolved = -1;
    for(let topic in topicStats){
    if(topicStats[topic] > maximumSolved){
        maximumSolved = topicStats[topic];
        strongTopic = topic;
    }
}

    const solvedQuestions = await Question.find({
        solved:true
    });
    const totalQuestions = allQuestions.length;
    const solvedCount = solvedQuestions.length;
    const unsolvedCount = totalQuestions - solvedCount;
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

const today = new Date();
const dueQuestions = allQuestions.filter((q)=>{
    return new Date(q.nextRevisionDate)
    <= today;
});

let streakCount = 0;
allQuestions.forEach((q)=>{
    if(q.solved){
        streakCount++;
    }
});

    res.render("questions",{
        allQuestions,
        totalQuestions,
        solvedCount,
        unsolvedCount,
        progressPercentage,
        easyCount,
        mediumCount,
        hardCount,
        dueQuestions,
        topicStats,
        streakCount,
        weakTopic,
        strongTopic,
        activeGoals,
        completedGoals
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
    const progressPercentage = totalQuestions === 0 ? 0
        : Math.floor((solvedCount / totalQuestions) * 100);

    res.render("questions", {
        allQuestions,
        totalQuestions,
        solvedCount,
        progressPercentage
    });
});

app.get("/questions/sort/priority", async(req,res)=>{

    let allQuestions = await Question.find();

    const priorityOrder = {
        High:1,
        Medium:2,
        Low:3
    };

    allQuestions.sort((a,b)=>{
        return priorityOrder[a.revisionPriority]
        -
        priorityOrder[b.revisionPriority];
    });

    const solvedQuestions = allQuestions.filter(
        (q)=>q.solved
    );

    const totalQuestions = allQuestions.length;

    const solvedCount = solvedQuestions.length;

    const unsolvedCount =
    totalQuestions - solvedCount;

    const progressPercentage =
    totalQuestions===0
    ? 0
    : Math.floor(
        (solvedCount/totalQuestions)*100
    );

    const easyCount = allQuestions.filter(
    (q)=>q.difficulty.toLowerCase()==="easy"
    ).length;

    const mediumCount = allQuestions.filter(
    (q)=>q.difficulty.toLowerCase()==="medium"
    ).length;

    const hardCount = allQuestions.filter(
    (q)=>q.difficulty.toLowerCase()==="hard"
    ).length;

    res.render("questions",{
        allQuestions,
        totalQuestions,
        solvedCount,
        unsolvedCount,
        progressPercentage,
        easyCount,
        mediumCount,
        hardCount
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

app.delete("/delete-goal/:id", async(req,res)=>{
    await Goal.findByIdAndDelete(
        req.params.id
    );
    res.redirect("/questions");
});

app.put("/edit/:id", async(req,res)=>{
    req.body.lastRevised = new Date();
    req.body.nextRevisiondate = new Date(Date.now() + 3*24*60*1000);
    await Question.findByIdAndUpdate(
        req.params.id,
        req.body,
    );
    res.redirect("/questions");
});

app.put("/revision-complete/:id", async(req,res)=>{
    const foundQuestion = await Question.findById(req.params.id);
    foundQuestion.lastRevised = new Date();
    foundQuestion.nextRevisionDate = new Date(Date.now() + 3*24*60*60*1000
    );
    await foundQuestion.save();
    res.redirect("/questions");
});

app.put("/complete-goal/:id", async(req,res)=>{
    await Goal.findByIdAndUpdate(
        req.params.id,
        {
            completed:true
        }
    );
    res.redirect("/questions");
});

app.post("/set-goal", async(req,res)=>{
    const endDate = new Date(Date.now() +req.body.goalDays * 24 * 60 * 60 * 1000
    );
    await Goal.create({
        topic:req.body.topic,
        goalDays:req.body.goalDays,
        endDate:endDate
    });
    res.redirect("/questions");
});

app.patch("/toggle/:id", async(req,res)=>{
    const foundQuestion = await Question.findById(req.params.id);
    foundQuestion.solved = !foundQuestion.solved;
    foundQuestion.lastRevised = new Date();
    await foundQuestion.save();
    res.redirect("/questions");
});

app.listen(3000,()=>{
    console.log("Server Started");
});