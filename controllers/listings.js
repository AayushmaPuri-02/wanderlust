const Listing = require("../models/listing");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig.js");


const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const { category, search } = req.query;

    const validCategories = [
        "Mountains",
        "Beaches",
        "Cities",
        "Camping"
    ];

    let filter = {};

    // Category filtering
    if (category && validCategories.includes(category)) {
        filter.category = category;
    }

    // Destination search
    if (typeof search === "string" && search.trim()) {
        const searchTerm = search.trim();

        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.location = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index.ejs", {
        allListings,
        selectedCategory: validCategories.includes(category) ? category : null
    });
};
module.exports.renderNewForm = (req, res) => {
    console.log(req.user);
    res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
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
}


module.exports.createListing = async (req, res) => {
//         let response = await geocodingClient.forwardGeocode({
//         query: req.body.listing.location,
//         limit: 1
// }).send()

const response = await geocodingClient.forwardGeocode({
    query: `${req.body.listing.location}, ${req.body.listing.country}`,
    limit: 1
}).send(); 
    //req.body is an object { with the fields}
    //let {title, description, image, price, country, location} = req.body;
    //instead of this we can send and object from the form rather than individual value

    let url = req.file.path;
    let filename = req.file.filename;
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;        //to create a owner
    newListing.image = {url, filename};
    newListing.geometry = response.body.features[0].geometry
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New listing saved")
    res.redirect("/listings");
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    // Find the existing listing
    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    // Prevent form data from directly overwriting image information
    delete req.body.listing.image;

    const { location, country } = req.body.listing;

    // Check whether the location or country has changed
    const locationChanged =
        listing.location !== location ||
        listing.country !== country;

    // Update coordinates only when the location changes
    if (locationChanged) {
        const response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1
        }).send();

        // Handle invalid or unknown locations
        if (!response.body.features?.length) {
            throw new ExpressError(
                400,
                "Location not found. Please enter a valid location and country."
            );
        }

        // Save the new coordinates
        listing.geometry = response.body.features[0].geometry;
    }

    // Update the remaining listing fields
    listing.set(req.body.listing);

    // Handle image updates
    if (req.file) {
        // Remember the old Cloudinary image
        const oldFilename = listing.image?.filename;

        // Get the new uploaded image information
        const url = req.file.path;
        const filename = req.file.filename;

        // Update the listing image
        listing.image = { url, filename };

        // Save listing changes before deleting the old image
        await listing.save();

        // Delete the previous Cloudinary image
        if (oldFilename?.startsWith("wanderlust_DEV/")) {
            try {
                await cloudinary.uploader.destroy(oldFilename);
            } catch (err) {
                console.error(
                    "Failed to delete old Cloudinary image:",
                    err
                );
            }
        }
    } else {
        // Save changes when no new image is uploaded
        await listing.save();
    }

    req.flash("success", "Listing updated!");

    res.redirect(`/listings/${id}`);
};


module.exports.renderEditForm = async (req, res) => {
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
    let originalImageUrl = listing.image.url;
    originalImageUrl=  originalImageUrl.replace("/upload", "/upload/c_fill,h_300,w_250")
    res.render("listings/edit.ejs", { listing , originalImageUrl});
}; 

module.exports.destroyListing = async (req, res) => {
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
}