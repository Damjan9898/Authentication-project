require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')




const app = express();

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());

app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });


app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')


const userSchema = new mongoose.Schema({
    username : String,
    password: String,
    googleId : String,
    secret: String
})

// const secretSchema = new mongoose.Schema({
//     username : String,
//     password: String,
//     googleId : String
// })


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

//Bitno da bude ovde
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    //Ovo se dodaje zbog odedjenog issue
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    profileFields: ['id', 'emails', 'name']
  },
  function(accessToken, refreshToken, profile, cb) {

    //Ovako nor od gugla mogu da izvucem ime i prezime i upisem u bazu
    //Profile : prikaz celog profila
    // profile.name.family_name - Prikaz prezimena
    // profile.name.givenName - Prikaz imena
    // profile.emails[0].value - Prikaz email-a
    
    console.log(profile)

    User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", (req, res)=>{
    res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

  
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/secrets", (req, res)=>{
    
    //Not equal to null
    User.find({secret: {$ne:null}}, (err, users)=>{
        if(!err){
            res.render("secrets", {usersWithSecrets: users})
        }
    })
})

app.get("/logout", (req, res)=>{
    
    req.logout((err)=>{
        if(!err){
            res.redirect("/")
        }
    });
    

});

app.get("/submit", (req, res)=>{

    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
});

app.post("/submit", (req, res)=>{

   let newSecret = req.body.secret;

   User.findById(req.user.id, (err, user)=>{
        if(!err){
            user.secret = newSecret;
            user.save((err)=>{
                if(!err){
                    res.redirect("/secrets")
                }
            })
        }
   })

   console.log(req.user.id)

});





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

})