const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const { listingSchema , reviewSchema} = require("../schema.js");
const mongoose = require("mongoose");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");



// index route
router.get("/", async (req, res) => {
    const allListings = await Listing.find({});
    
    //console.log(allListings);      // allListings is an array of objects.
    res.render("listings/index.ejs", { allListings });
});


//new route - form to crete new lisitng
router.get("/new", isLoggedIn, (req, res) => {
    console.log(req.user);

    res.render("listings/new.ejs");
});


// edit route
router.get("/:id/edit",  isLoggedIn , isOwner, async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        // throw new ExpressError(404, "Listing not found");
          req.flash("error", "Listing not found");
         return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
});


// show -route
router.get("/:id", async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    const listing = await Listing.findById(id).populate({path : "reviews", populate :{path : "author"}}).populate("owner");
    console.log(listing);
    if (!listing) {
        // throw new ExpressError(404, "Listing not found");
        req.flash("error", "Listing not found");
        return  res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
});


// Update route
router.put("/:id", isLoggedIn, isOwner, validateListing, async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }


    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { runValidators: true }
    );

    if (!updatedListing) {
        throw new ExpressError(404, "Listing not found");
    }
     req.flash("success", "Listing updated!")
    res.redirect(`/listings/${id}`);
});


//create route
router.post("/", isLoggedIn, validateListing, async (req, res) => {

    //req.body is an object { with the fields}
    //let {title, description, image, price, country, location} = req.body;
    //instead of this we can send and object from the form rather than individual value

    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;        //to create a owner
    await newListing.save();
    req.flash("success", "New listing saved")
    res.redirect("/listings");
});


//delete route
router.delete("/:id",isLoggedIn, isOwner, async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    let deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        throw new ExpressError(404, "Listing not found");
    }
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
});


module.exports = router