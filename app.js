require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
// const encrypt = require("mongoose-encryption")
const md5 = require("md5");
const bcrypt = require('bcrypt');
//Koliko puta da se ponovo hashuje lozinka uz salt vrednost
const saltRounds = 10;

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
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

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

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err){
            const user = new User({
                email : req.body.email,
                password: hash
            })
    
            user.save((err)=>{
                if(!err){
                    res.render("secrets")
                }else{
                    console.log(err)
                }
            });
        }
        
    });


    
    //MD5 lozinka
    // const user = new User({
    //     email : req.body.email,
    //     password: md5(req.body.password)
    // })

    // user.save((err)=>{
    //     if(!err){
    //         res.render("secrets")
    //     }else{
    //         console.log(err)
    //     }
    // });

})

app.post("/login", (req, res)=>{

    User.findOne({email:req.body.email}, (err, user)=>{
        if(!err){
            //md5
            // if(user.password === md5(req.body.password)){
            //     res.render("secrets")
            // }else{
            //   console.log("Good email, wrong password")  
            // }

            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(result){
                    res.render("secrets")
                }
            });

        }else{
            console.log(err)
        }
    })

})