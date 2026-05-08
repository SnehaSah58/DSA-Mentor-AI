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
    res.render("questions",{allQuestions});
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

app.listen(3000,()=>{
    console.log("Server Started");
});