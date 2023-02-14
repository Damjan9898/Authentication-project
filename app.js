require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

const app = express();

console.log(process.env.SECRET)

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')


const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

//Bitno je da bude pre mongoose modela
// process.env.SECRET je varijabla iz .env fajla koji je nevidljiv
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema)



app.get("/", (req, res)=>{
    res.render("home")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.listen("3000", ()=>{
    console.log("Listen on port 3000")
})


app.post("/register", (req, res)=>{
    
    const user = new User({
        email : req.body.email,
        password: req.body.password
    })

    user.save((err)=>{
        if(!err){
            res.render("secrets")
        }else{
            console.log(err)
        }
    });

})

app.post("/login", (req, res)=>{

    User.findOne({email:req.body.email}, (err, user)=>{
        if(!err){
            if(user.password === req.body.password){
                res.render("secrets")
            }else{
              console.log("Good email, wrong password")  
            }
        }else{
            console.log(err)
        }
    })

})