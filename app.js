require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
// const encrypt = require("mongoose-encryption")
// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// //Koliko puta da se ponovo hashuje lozinka uz salt vrednost
// const saltRounds = 10;
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express();

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());

app.use(passport.session());

console.log(process.env.SECRET)

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });


app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')


const userSchema = new mongoose.Schema({
    username : String,
    password: String
})


userSchema.plugin(passportLocalMongoose);

//Bitno je da bude pre mongoose modela
// process.env.SECRET je varijabla iz .env fajla koji je nevidljiv
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema)


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", (req, res)=>{
    res.render("home")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/secrets", (req, res)=>{
    
        if(req.isAuthenticated()){
            res.render("secrets")
        }else{
            res.redirect("/login")
        }
})

app.get("/logout", (req, res)=>{
    
    req.logout((err)=>{
        if(!err){
            res.redirect("/")
        }
    });
    

})



app.listen("3000", ()=>{
    console.log("Listen on port 3000")
})


app.post("/register", (req, res)=>{

    //MORA DA SE KORISTI USERNAME
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (!err) {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
            
        }else{
            console.log(err)
            res.redirect("/register")
            
        }
    
      });

    //Bcrypt
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     if(!err){
    //         const user = new User({
    //             email : req.body.email,
    //             password: hash
    //         })
    
    //         user.save((err)=>{
    //             if(!err){
    //                 res.render("secrets")
    //             }else{
    //                 console.log(err)
    //             }
    //         });
    //     }
        
    // });


    
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


    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //passport code
    req.login(user, (err)=>{
        if(!err){
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }else{
            res.redirect("/")
        }
    })

    //Bcrypt
    // User.findOne({email:req.body.email}, (err, user)=>{
    //     if(!err){
    //         //md5
    //         // if(user.password === md5(req.body.password)){
    //         //     res.render("secrets")
    //         // }else{
    //         //   console.log("Good email, wrong password")  
    //         // }

    //         bcrypt.compare(req.body.password, user.password, function(err, result) {
    //             if(result){
    //                 res.render("secrets")
    //             }
    //         });

    //     }else{
    //         console.log(err)
    //     }
    // })

})