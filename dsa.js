require("dotenv").config();
const {
GoogleGenerativeAI
} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);
const axios = require("axios");

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:
        process.env.EMAIL_USER,
        pass:
        process.env.EMAIL_PASS
    }
});

transporter.verify(function(error,success){
    if(error){
        console.log(error);
    } else{
        console.log("mail working");
    }
});

const Revision = require("./models/Revision");
const UserProgress = require("./models/UserProgress");
const Goal = require("./models/Goal")
const methodOverride = require("method-override");
const Question = require("./models/Question");
const mongoose = require("mongoose");
const express = require ("express");
const app = express();

const bcrypt =
require("bcrypt");

const session =
require("express-session");

const User =
require("./models/User");

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("MongoDB Connected 😎");
})
.catch((err)=>{
    console.log(err);
});


app.set("view engine" , "ejs");

app.use(express.json());
app.use(express.urlencoded({extended: true}));   //for read data
app.use(session({
    secret:"mysupersecret",
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge: 1000*60*60*24
    }
}));

app.use(express.static("public"));
app.use(methodOverride("_method"));

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/add-Question",(req,res)=>{
    res.render("addQuestion");
});

app.get("/signup",(req,res)=>{
    res.render("signup");
});


app.post("/add-Question",async(req,res)=>{
    const {title , difficulty, topic, description } = req.body;
    const newQuestion = new Question({
        title, difficulty, topic, description
    });
    await newQuestion.save();                 // mongodb save horha
    res.send("Question Added Successfully");
});



function isLoggedIn(
    req,res,next
){
    if(!req.session.userId){
        return res.redirect(
            "/login"
        );
    }
    next();
}

app.get("/questions",
isLoggedIn,
async(req,res)=>{
    const allQuestions = await Question.find();
    const allProgress = await UserProgress.find({
        userId:req.session.userId

    });

    const progressMap = {};
    allProgress.forEach((p)=>{
        progressMap[
            p.questionId.toString()
        ] = p;

    });

    const solvedQuestions =
    allProgress.filter((p)=>{

        return p.solved === true;

    });


    const totalQuestions =
    allQuestions.length;

    const solvedCount =
    solvedQuestions.length;

    const unsolvedCount =
    totalQuestions - solvedCount;

    const progressPercentage =
    totalQuestions === 0

    ? 0

    : Math.floor(

        (solvedCount /
        totalQuestions) * 100

    );

    const easyCount =
    allQuestions.filter((q)=>{

        return q.difficulty === "Easy";

    }).length;

    const mediumCount =
    allQuestions.filter((q)=>{

        return q.difficulty === "Medium";

    }).length;

    const hardCount =
    allQuestions.filter((q)=>{
        return q.difficulty === "Hard";
    }).length;


    const topicStats = {};
    allQuestions.forEach((q)=>{
        if(!topicStats[q.topic]){
            topicStats[q.topic] = {
                solved:0,
                total:0
        }
    };

    topicStats[q.topic].total++;
        const progress =
        progressMap[
            q._id.toString()
        ];


        if(progress?.solved){
            topicStats[q.topic]
            .solved++;

        }
    });


    let weakTopic = "";
    let weakestPercentage = Infinity;

    for(let topic in topicStats){

    const solved = topicStats[topic].solved;

    const total = topicStats[topic].total;

    const percentage = (solved / total) * 100;

    if(
        percentage
        < weakestPercentage
    ){

        weakestPercentage =
        percentage;

        weakTopic =
        topic;

    }

}

    let strongTopic = "";

let strongestPercentage = -1;

for(let topic in topicStats){

    const solved =
    topicStats[topic]
    .solved;

    const total =
    topicStats[topic]
    .total;


    const percentage =
    (solved / total) * 100;

    if(
        percentage
        > strongestPercentage
    ){

        strongestPercentage = percentage;

        strongTopic = topic;

    }

}

    const today =
    new Date();
    const dueQuestions =
    allQuestions.filter((q)=>{

        const progress =
        progressMap[
            q._id.toString()
        ];

        return(

            progress?.nextRevisionDate

            &&

            new Date(
                progress.nextRevisionDate
            ) <= today

        );

    });

    const streakCount = solvedQuestions.length;

    const user = await User.findById(
        req.session.userId
    );

    res.render("questions",
        {
            allQuestions,
            progressMap,
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
            user
        }
    );
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

    dueQuestions:[],

    totalQuestions,
    solvedCount,

    unsolvedCount:
    totalQuestions - solvedCount,

    progressPercentage,

    easyCount:0,
    mediumCount:0,
    hardCount:0,

    topicStats:{},

    streakCount:0,

    weakTopic:"",
    strongTopic:"",

    activeGoals:[],
    completedGoals:[],

    progressMap:{}

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

    dueQuestions:[],

    totalQuestions,
    solvedCount,

    unsolvedCount:
    totalQuestions - solvedCount,

    progressPercentage,

    easyCount:0,
    mediumCount:0,
    hardCount:0,

    topicStats:{},

    streakCount:0,

    weakTopic:"",
    strongTopic:"",

    activeGoals:[],
    completedGoals:[],

    progressMap:{}

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


app.get("/goals",

isLoggedIn,

async(req,res)=>{

    const allQuestions =
    await Question.find();

    const allProgress =
    await UserProgress.find({

        userId:req.session.userId

    });

    const progressMap = {};
    allProgress.forEach((p)=>{

        progressMap[
            p.questionId.toString()
        ] = p;

    });


    // AUTO COMPLETE GOALS 😎🔥

    const allGoals =
    await Goal.find({

        userId:req.session.userId

    });

    for(let goal of allGoals){

        const topicQuestions =

        allQuestions.filter((q)=>{

            return q.topic ===
            goal.topic;

        });

        let solvedCount = 0;

        topicQuestions.forEach((q)=>{

            const progress =

            progressMap[
                q._id.toString()
            ];

            if(
                progress &&
                progress.solved
            ){

                solvedCount++;

            }

        });

        if(

            topicQuestions.length > 0

            &&

            solvedCount ===
            topicQuestions.length

        ){

            goal.completed = true;

        }

        else{

            goal.completed = false;

        }

        await goal.save();

    }

    // UPDATED GOALS 😎🔥

    const activeGoals =
    await Goal.find({

        completed:false,

        userId:req.session.userId

    });



    const completedGoals =
    await Goal.find({

        completed:true,

        userId:req.session.userId

    });

    const user = await User.findById(
        req.session.userId
    );

    res.render(

        "goals",

        {

            activeGoals,

            completedGoals,

            allQuestions,

            progressMap,

            user

        }

    );

});

app.get("/login" , (req,res)=>{
    res.render("login");
})


    app.get("/",(req,res)=>{
    res.render("home");
});

    app.get("/about",(req,res)=>{
    res.render("about");
});


app.get("/generate-question",

async(req,res)=>{

try{

const model =
genAI.getGenerativeModel({

model:"gemini-2.5-flash"

});

const result =
await model.generateContent(

"Generate one DSA or HR interview question"

);

const response =
await result.response;

const text =
response.text();

res.json({

question:text

});

}

catch(err){

console.log(err);

res.json({

question:"Failed to generate question 😭"

});

}

});

app.get("/dashboard",
isLoggedIn,
async(req,res)=>{
    const allQuestions =
    await Question.find();
    const allProgress = await UserProgress.find({
    userId:req.session.userId
    });

    const progressMap = {};
    allProgress.forEach((p)=>{

        progressMap[
            p.questionId.toString()
        ] = p;

    });

    const solvedQuestions =
    allProgress.filter((p)=>{

        return p.solved;

    });


    const totalQuestions =
    allQuestions.length;


    const solvedCount =
    solvedQuestions.length;


    const unsolvedCount =
    totalQuestions -
    solvedCount;


    const progressPercentage = totalQuestions === 0 ? 0 : Math.floor(
        (solvedCount /
        totalQuestions) * 100

    );

    const topicStats = {};
    allQuestions.forEach((q)=>{

        if(!topicStats[q.topic]){

            topicStats[q.topic] = {

                solved:0,

                total:0

            };

        }

        topicStats[q.topic]
        .total++;

        const progress =
        progressMap[
            q._id.toString()
        ];

        if(
            progress &&
            progress.solved
        ){

            topicStats[q.topic]
            .solved++;

        }

    });


    let weakTopic = "";

    let weakestPercentage =
    Infinity;

    for(let topic in topicStats){

        const solved =
        topicStats[topic]
        .solved;

        const total =
        topicStats[topic]
        .total;

        const percentage =
        (solved / total) * 100;


        if(
            percentage <
            weakestPercentage
        ){

            weakestPercentage =
            percentage;

            weakTopic =
            topic;
        }
    }

    let strongTopic = "";

    let strongestPercentage =
    -1;

    for(let topic in topicStats){

        const solved =
        topicStats[topic]
        .solved;

        const total =
        topicStats[topic]
        .total;

        const percentage =
        (solved / total) * 100;

        if(
            percentage >
            strongestPercentage
        ){

            strongestPercentage =
            percentage;

            strongTopic =
            topic;

        }

    }

    const streakCount =
    solvedQuestions.length;

    const user = await User.findById(
        req.session.userId
    );

    res.render(

        "dashboard",

        {
            totalQuestions,
            solvedCount,
            unsolvedCount,
            progressPercentage,
            topicStats,
            weakTopic,
            strongTopic,
            streakCount,
            user

        }

    );

});


function isLoggedIn(req,res,next){
    if(
        !req.session.userId
    ){
        return res.redirect(
            "/login"
        );
    }
    next();
}


app.get("/mock-interview",

(req,res)=>{

    res.render(

        "mockInterview"

    );

});

app.get("/mock-question",
async(req,res)=>{

try{
    const model =
    genAI.getGenerativeModel({
        model:"gemini-2.5-flash"

    });

    const result =
    await model.generateContent(

`Generate one DSA interview question.

Rules:
- medium difficulty
- beginner friendly
- no answer
- only question`

    );

    const response =
    await result.response;

    const text =
    response.text();

    res.json({

        question:text

    });

}

catch(err){

    console.log(err);
    res.json({

        question:
        "Failed to load question 😭"

    });
}

});

app.get("/revision",

isLoggedIn,

async(req,res)=>{

    const revisions =
    await Revision.find({

        userId:req.session.userId

    });

    const user = await User.findById(
        req.session.userId
    );

    res.render(
        "revision",

        {

            revisions,
            user

        }

    );

});


app.get("/profile",
isLoggedIn,
async(req,res)=>{
    const user =
    await User.findById(
        req.session.userId

    );

    const allQuestions =
    await Question.find();

    const allProgress =
    await UserProgress.find({
        userId:req.session.userId

    });

    let solvedCount = 0;
    allProgress.forEach((p)=>{
        if(p.solved){
            solvedCount++;

        }

    });

    const unsolvedCount = allQuestions.length - solvedCount;
    const topicStats = {};
    allQuestions.forEach((q)=>{
        const progress =
        allProgress.find((p)=>{
            return p.questionId
            .toString()
            ===
            q._id.toString();
        });

        if(!topicStats[q.topic]){
            topicStats[q.topic] = 0;
        }

        if(progress && progress.solved){
            topicStats[q.topic]++;
        }

    });

    let strongTopic = "";
    let weakTopic = "";
    let maxSolved = -1;
    let minSolved = Infinity;
    for(let topic in topicStats){
        if(
            topicStats[topic]
            >
            maxSolved

        ){

            maxSolved =
            topicStats[topic];
            strongTopic =
            topic;

        }

        if(
            topicStats[topic]
            <
            minSolved
        ){

            minSolved =
            topicStats[topic];
            weakTopic =
            topic;
        }
    }

    let streakCount = 0;
    allProgress.forEach((p)=>{
        if(p.solved){
            streakCount++;
        }
    });

    res.render(
        "profile",
        {
            user,
            solvedCount,
            unsolvedCount,
            streakCount,
            strongTopic,
            weakTopic
        }

    );

});


app.get("/profile/edit",

isLoggedIn,
async(req,res)=>{
    const user =
    await User.findById(
        req.session.userId
    );

    res.render(
        "editProfile",
        {
            user
        }
    );

});


app.get("/logout",
(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/");
    });

});

app.delete("/delete/:id", async (req,res)=>{
    await Question.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
});

app.delete("/delete-goal/:id", async(req,res)=>{
    await Goal.findByIdAndDelete(
        req.params.id
    );
    res.redirect("/dashboard");
});

app.put("/edit/:id", async(req,res)=>{
    req.body.lastRevised = new Date();
    req.body.nextRevisiondate = new Date(Date.now() + 3*24*60*1000);
    await Question.findByIdAndUpdate(
        req.params.id,
        req.body,
    );
    res.redirect("/dashboard");
});

app.put("/revision-complete/:id", async(req,res)=>{
    const foundQuestion = await Question.findById(req.params.id);
    foundQuestion.lastRevised = new Date();
    foundQuestion.nextRevisionDate = new Date(Date.now() + 3*24*60*60*1000
    );
    await foundQuestion.save();
    res.redirect("/dashboard");
});

app.put("/complete-goal/:id", async(req,res)=>{
    await Goal.findByIdAndUpdate(
        req.params.id,
        {
            completed:true
        }
    );
    res.redirect("/dashboard");
});


app.post("/evaluate-answer",

async(req,res)=>{

try{

    const question =
    req.body.question;

    const answer =
    req.body.answer;



    const model =
    genAI.getGenerativeModel({
        model:"gemini-2.5-flash"
    });
    const result =
    await model.generateContent(

`You are an AI interviewer.

Question:
${question}

User Answer:
${answer}

Evaluate the answer.

Give:
1. strengths
2. mistakes
3. improvements
4. rating out of 10

Keep feedback beginner friendly.`
    );
    const response =
    await result.response;
    const text =
    response.text();
    res.json({
        feedback:text
    });

}

catch(err){
    console.log(err);
    res.json({
        feedback:
        "Evaluation failed 😭"
    });
}

});

app.post("/ai-notes", async(req,res)=>{
console.log(process.env.GEMINI_API_KEY);
try{
    const topic = req.body.topic;
    const model = genAI.getGenerativeModel({
        model:"gemini-2.5-flash"
    });

    const result = await model.generateContent(

    `You are a DSA mentor.
    Generate detailed and different notes ONLY for the topic "${topic}".
    Include:

1. Definition
2. Important Concepts
3. Time Complexity
4. Space Complexity
5. Common Interview Questions
6. Real World Usage
7. Easy explanation with examples

Do NOT give generic DSA notes.
Only focus on ${topic}.`

);

    const response = await result.response;

    const text = response.text();

    res.json({
        notes:text
    });

}

catch(err){

    console.log(err);

    res.json({

        notes:"AI Notes failed 😭"

    });
}

});




app.post("/ai-hint",

async(req,res)=>{

try{

    const title =
    req.body.title;

    const description =
    req.body.description;

    const topic =
    req.body.topic;

    const model =
    genAI.getGenerativeModel({

        model:"gemini-2.5-flash"

    });

    const result =
    await model.generateContent(

`You are an expert DSA mentor.

Give ONLY a small hint for this DSA question.

Question:
${title}

Description:
${description}

Topic:
${topic}

Rules:
- Do NOT give code
- Do NOT give full solution
- Only give solving approach
- Keep it short and beginner friendly`

    );

    const response =
    await result.response;

    const text =
    response.text();

    res.json({

        hint:text

    });

}

catch(err){

    console.log(err);

    res.json({

        hint:
        "AI Hint failed 😭"

    });
}
});


app.post("/ai-chat",

async(req,res)=>{

try{
    const userMessage =
    req.body.message;

    const model =
    genAI.getGenerativeModel({
        model:"gemini-2.5-flash"

    });

    const result =
    await model.generateContent(

`You are an expert DSA Mentor chatbot.

Answer this student question in simple words.

Question:
${userMessage}

Rules:
- beginner friendly
- easy explanation
- concise answer
- DSA related only`

    );
    const response =
    await result.response;
    const text =
    response.text();
    res.json({
        reply:text
    });

}

catch(err){
    console.log(err);
    res.json({
        reply:
        "AI Mentor failed 😭"
    });
}
});


app.post("/mock-feedback",
async(req,res)=>{
try{
const answer = req.body.answer;
const model = genAI.getGenerativeModel({
model:"gemini-2.5-flash"
});
const result = await model.generateContent(
`Give interview feedback for this answer:
${answer}`
);
const response = await result.response;
const text = response.text();
res.json({
feedback:text
});
}
catch(err){
console.log(err);
res.json({
feedback:"AI Feedback failed 😭"
});
}
});


app.post("/ai-roadmap",

async(req,res)=>{

try{

    const topic =
    req.body.topic;



    const model =
    genAI.getGenerativeModel({

        model:"gemini-2.5-flash"

    });



    const result =
    await model.generateContent(

`You are an expert DSA mentor.

Generate a roadmap for learning ${topic}.

Include:
1. Beginner concepts
2. Intermediate concepts
3. Advanced concepts
4. Practice strategy
5. Important interview patterns

Keep roadmap easy and beginner friendly.`

    );



    const response =
    await result.response;



    const text =
    response.text();



    res.json({

        roadmap:text

    });

}

catch(err){

    console.log(err);



    res.json({

        roadmap:
        "AI Roadmap failed 😭"

    });

}

});


app.post("/goals/add",
isLoggedIn,

async(req,res)=>{

    const {

        topic,

        goalDays

    } = req.body;

    const today =
    new Date();

    const endDate =
    new Date();
    endDate.setDate(
        today.getDate()+Number(goalDays)

    );

    const newGoal =
    new Goal({

        topic,

        goalDays,

        endDate,

        completed:false,

        userId:
        req.session.userId

    });

    await newGoal.save();
    res.redirect("/goals");

});

app.post("/login",

async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({ email
    });

    if(!user){
        return res.send(
            "User not found"
        );
    }

    if(!user.isVerified){
        return res.send(
            "Please verify your email first"
        );
    }

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if(!validPassword){
        return res.send(
            "Invalid Password"
        );
    }

    req.session.userId =
    user._id;
    res.redirect("/dashboard"
    );
});


app.post("/signup",

async(req,res)=>{
    const {
        username,
        email,
        password
    } = req.body;

    const existingUser =
    await User.findOne({
        email

    });

    console.log(existingUser);

    if(existingUser){
        if(existingUser.isVerified){
        return res.send(
            "User already exists"
        );
    }
    }

    const otp =
    Math.floor( 100000 + Math.random()*900000 ).toString();

    const hashedPassword =
    await bcrypt.hash(password , 10);

    const newUser =
    new User({

        username,

        email,

        password:
        hashedPassword,

        otp,

        isVerified:false

    });

    await newUser.save();
    await transporter.sendMail({

        from:
        process.env.EMAIL_USER,

        to:email,

        subject:
        "DSA Mentor AI OTP",


        text:
        `Your OTP is ${otp}`

    });


    res.render(

        "verify",

        {
            email
        }
    );

});



app.post("/verify",
async(req,res)=>{
    const {

        email,

        otp

    } = req.body;

    const user =
    await User.findOne({

        email

    });

    if(

        user &&
        user.otp === otp

    ){

        user.isVerified = true;
        user.otp = "";
        await user.save();
        return res.redirect(
            "/login"
        );

    }

    res.send("Invalid OTP");

});


app.post("/profile/edit",

isLoggedIn,
async(req,res)=>{
    const {
        username,
        email,
        avatar
    } = req.body;

    await User.findByIdAndUpdate(

        req.session.userId,

        {

            username,

            email,

            avatar

        }

    );

    res.redirect(
        "/profile"
    );

});


app.post("/revision/add",

isLoggedIn,

async(req,res)=>{

    const {

        topic,

        priority,

        notes

    } = req.body;

    const today =
    new Date();
    const nextRevision =
    new Date();

    nextRevision.setDate(

        today.getDate() + 3

    );

    const newRevision =
    new Revision({

        userId:
        req.session.userId,

        topic,

        priority,

        notes,

        lastRevisedDate:
        today,

        nextRevisionDate:
        nextRevision

    });
    await newRevision.save();
    res.redirect("/revision");

});

app.post("/revision/update/:id",
isLoggedIn,
async(req,res)=>{
    await Revision.findByIdAndUpdate(
        req.params.id,
        {
            priority:
            req.body.priority
        }
    );
    res.redirect("/revision");
});


app.post("/revision/done/:id",
isLoggedIn,

async(req,res)=>{

    const today =
    new Date();
    const nextRevision =
    new Date();
    nextRevision.setDate(
        today.getDate() + 3
    );

    await Revision.findByIdAndUpdate(

        req.params.id,
        {
            lastRevisedDate:
            today,
            nextRevisionDate:
            nextRevision

        }
    );
    res.redirect("/revision");

});

app.patch("/toggle/:id",
isLoggedIn,
async(req,res)=>{
    const questionId =
    req.params.id;
    const userId =
    req.session.userId;
    let progress =
    await UserProgress.findOne({
        userId,
        questionId
    });

    if(!progress){
        progress =
        new UserProgress({
            userId,
            questionId,
            solved:true

        });
    }

    else{
        progress.solved =! progress.solved;
    }

    await progress.save();
    res.redirect("/dashboard"
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log("Server Started");
});