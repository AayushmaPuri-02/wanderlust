const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const { listingSchema , reviewSchema} = require("../schema.js");
const mongoose = require("mongoose");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");



// index route
router.get("/",listingController.index );


//new route - form to crete new lisitng
router.get("/new", isLoggedIn, listingController.renderNewForm);


// edit route
router.get("/:id/edit",  isLoggedIn , isOwner, listingController.updateListing);


// show -route
router.get("/:id", listingController.showListings);


// Update route
router.put("/:id", isLoggedIn, isOwner, validateListing, listingController.renderEditForm );


//create route
router.post("/", isLoggedIn, validateListing, listingController.createListing);


//delete route
router.delete("/:id",isLoggedIn, isOwner, listingController.destroyListing);


module.exports = router