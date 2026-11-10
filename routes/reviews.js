const express = require("express");
const router = express.Router({ mergeParams: true });
const ExpressError = require("../utils/ExpressError");
const Listing = require("../models/listing");
const Review = require("../models/review.js")
const { listingSchema , reviewSchema} = require("../schema.js");
const mongoose = require("mongoose");
const {isLoggedIn, isOwner, validateListing, validateReview, isReviewAuthor} = require("../middleware.js");

const reviewController = require("../controllers/reviews.js")
// REVIEWS
//post route
router.post("/", isLoggedIn, validateReview, reviewController.createReview)

//delete  review route
router.delete("/:reviewId", isLoggedIn,isReviewAuthor, reviewController.destroyReview);


module.exports = router;