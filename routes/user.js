const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { listingSchema , reviewSchema, userSchema} = require("../schema.js");
const passport = require("passport");
const {isLoggedIn, saveRedirectUrl, validateSignup} = require("../middleware.js")

const userController = require("../controllers/users.js")

router.route("/signup")
          .get( userController.renderSignupForm)
          .post( validateSignup, userController.signup);

//get login page

router.route("/login")
          .get( userController.renderloginForm)
          .post( saveRedirectUrl,
            passport.authenticate("local", {failureRedirect : "/login" , failureFlash : true}), 
            userController.login
        ) 

//LOGOUT
router.get("/logout", userController.logout)

module.exports = router;