const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError");
const { listingSchema , reviewSchema, userSchema} = require("./schema.js");
const Review = require("./models/review.js")


module.exports.isLoggedIn = (req,res,next)=>{
    // console.log(req.user);
        if(!req.isAuthenticated()){
            req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl; 
    }
    next();
} 

module.exports.isOwner = async(req,res,next)=>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if( !listing.owner.equals(res.locals.currUser._id)){
        req.flash("error", "Permission denied : You are not the owner of the listing..");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

// Middleware for server-side validation using Joi
module.exports.validateListing = (req, res, next) => {

    const { error } = listingSchema.validate(req.body, {
        abortEarly: false // Joi collects all validation errors instead of reporting only the first.
    });

    if (error) {
        const errMsg = error.details
            .map((el) => el.message)
            .join(", ");

        throw new ExpressError(400, errMsg);
    }

    next();
};


//Middleware for review validation
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body, {
        abortEarly: false // Joi collects all validation errors instead of reporting only the first.
    });
    if (error) {
        const errMsg = error.details .map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "Permission denied: You did not create this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateSignup = (req, res, next) => {
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