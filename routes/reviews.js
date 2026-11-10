const express = require("express");
const router = express.Router({ mergeParams: true });
const ExpressError = require("../utils/ExpressError");
const Listing = require("../models/listing");
const Review = require("../models/review.js")
const { listingSchema , reviewSchema} = require("../schema.js");
const mongoose = require("mongoose");
const {isLoggedIn, isOwner, validateListing, validateReview, isReviewAuthor} = require("../middleware.js");

// REVIEWS
//post route
router.post("/", isLoggedIn, validateReview, async(req,res)=>{
   const { id } = req.params;
   
   if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }
    let listing = await  Listing.findById(id);
   if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }
   let newReview = new Review(req.body.review);
   newReview.author = req.user._id;
   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();
    req.flash("success", "New review added")
  res.redirect(`/listings/${listing._id}`)
})

//delete  review route
router.delete("/:reviewId", isLoggedIn,isReviewAuthor, async(req,res)=>{
    let {id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const belongsToLisiting = listing.reviews.some( review => review.toString() === reviewId);
    if(!belongsToLisiting){
        throw new ExpressError(404, "Review not found in this listing");
    }
    
    await Listing.findByIdAndUpdate(id, {$pull : {reviews : reviewId}});
    await Review.findByIdAndDelete(reviewId);
     req.flash("success", "Review deleted!")
    res.redirect(`/listings/${id}`)
})


module.exports = router;