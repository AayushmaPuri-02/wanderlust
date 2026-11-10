const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const listingsRouter = require("./routes/listings.js")
const reviewsRouter = require("./routes/reviews.js")
const userRouter = require("./routes/user.js")
const session = require("express-session")
const flash = require("connect-flash")
require("dotenv").config();
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")

// mongoose connection
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");

        app.listen(8080, () => {
            console.log("App is listening on port 8080");
        });

    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    cookie :{
        //expires : Date.now() + 7 *24 * 60 *60 *1000,
        maxAge :  7 *24 * 60 *60 *1000,
        httpOnly: true,
        sameSite: "lax"
    }
}

app.get("/", (req, res) => {
    res.send("GET request on /");
});

app.use(session(sessionOptions));     // express-session middleware allows  application to maintain session data across multiple requests.
app.use(flash());                                  //connect-flash relies on session support. - stores temporary messages in the session.
//use passprot wright after the session middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))  //the local strategy we have used in passport should be authnticated using this sutheticate method. t

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());            //storing  user infomation in a session 
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");                //res.locals - object  to make data available to templates rendered during the current request.
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

//demo user
// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email : "demofake@gmail.com",
//         username : "demousernameDemo"
//     });
//     let registeredUser = await User.register(fakeUser, "fakepassword");
//     res.send(registeredUser);         //the fields are email, username(unique), salt, hash
// })


//routes for listings 
app.use("/listings", listingsRouter);

//routes for reviews
app.use("/listings/:id/reviews", reviewsRouter);

app.use("/", userRouter);

// app.get("/testListing", (req,res)=>{
//     let sample = new Listing({
//         title : "Testing title",
//         description : "testing description",
//         price : 100,
//         location: "nepal",
//         country: "nepal"
//     })
//     sample.save().then((res)=>{console.log(res);}).catch((e)=>{console.log(e);});
//     res.send("sample saved")
// })



// Handle routes that do not exist
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});


// Centralized error-handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500
        ? "Something went wrong"
        : err.message || "Something went wrong";
    console.error(err);
    res.status(statusCode).render("error.ejs", { message });
});


// Start the application
main();