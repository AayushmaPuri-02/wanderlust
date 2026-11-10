const User = require("../models/user");
const { listingSchema , reviewSchema, userSchema} = require("../schema");

module.exports.renderSignupForm = (req, res) => {
    const formData = req.session.formData || {};
    delete req.session.formData;
    res.render("users/signup.ejs", { formData });
}

module.exports.signup = async (req, res) => {
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
}


module.exports.renderloginForm = (req,res)=>{
    res.render("users/login.ejs")
}


module.exports.login =  async(req,res)=>{
        req.flash("success", "welcome back to wanderlust");      //as logged in the session gets reset
        let redirectUrl = res.locals.redirectUrl || "/listings";
        //a
        delete req.session.redirectUrl; 
        res.redirect(redirectUrl);
} 

module.exports.logout = (req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", "you are logged out");
        res.redirect("/listings");
    })
} 