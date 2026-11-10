const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { listingSchema , reviewSchema, userSchema} = require("../schema.js");
const passport = require("passport");
const {isLoggedIn, saveRedirectUrl} = require("../middleware.js")


const validateSignup = (req, res, next) => {
    const { error, value } = userSchema.validate(req.body, {
        abortEarly: false
    });
    if (error) {
        const message = error.details
            .map((el) => el.message)
            .join(", ");

        // Preserve username and email, but never the password
        req.session.formData = {
            username: typeof req.body.username === "string" ? req.body.username : "",
            email: typeof req.body.email === "string" ? req.body.email : ""
        };

        req.flash("error", message);
        return res.redirect("/signup");
    }

    req.body = value;
    next();
};

// Show signup form
router.get("/signup", (req, res) => {
    const formData = req.session.formData || {};
    delete req.session.formData;
    res.render("users/signup.ejs", { formData });

});

// Handle signup

router.post("/signup", validateSignup, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email });
        const registeredUser  = await User.register(newUser, password);
        console.log("Registered User : ", registeredUser);
        req.login(registeredUser , (err)=>{
            if(err){
                return next(err);
            }
        req.flash("success", "Welcome to Wanderlust!");
        return res.redirect("/listings");
        })
    } catch (err) {
        req.session.formData = { username, email };
        if (err.name === "UserExistsError") {
            req.flash("error", "This username is already registered.");
        } else {
            console.error("Signup error:", err);
            req.flash("error", "Unable to create your account. Please try again.");
        }
        return res.redirect("/signup");
    }
});


//get login page
router.get("/login", (req,res)=>{
    res.render("users/login.ejs")
})

//POST req on login page
router.post("/login", saveRedirectUrl,
    passport.authenticate("local", {failureRedirect : "/login" , failureFlash : true}), 
    async(req,res)=>{
        req.flash("success", "welcome back to wanderlust");      //as logged in the session gets reset
        let redirectUrl = res.locals.redirectUrl || "/listings";
        //a
        delete req.session.redirectUrl; 
        res.redirect(redirectUrl);
}) 


//LOGOUT
router.get("/logout", (req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", "you are logged out");
        res.redirect("/listings");
    })
})

module.exports = router;