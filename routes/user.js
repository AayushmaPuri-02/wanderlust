const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { listingSchema , reviewSchema, userSchema} = require("../schema.js");
const passport = require("passport");
const {isLoggedIn, saveRedirectUrl, validateSignup} = require("../middleware.js")

const userController = require("../controllers/users.js")

// Show signup form
router.get("/signup", userController.renderSignupForm);

// Handle signup
router.post("/signup", validateSignup, userController.signup);


//get login page
router.get("/login", userController.renderloginForm)

//POST req on login page
router.post("/login", saveRedirectUrl,
    passport.authenticate("local", {failureRedirect : "/login" , failureFlash : true}), 
    userController.login
   ) 


//LOGOUT
router.get("/logout", userController.logout)

module.exports = router;