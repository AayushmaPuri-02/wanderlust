const Listing = require("../models/listing");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig.js");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    
    //console.log(allListings);      // allListings is an array of objects.
    res.render("listings/index.ejs", { allListings });
}

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

    //req.body is an object { with the fields}
    //let {title, description, image, price, country, location} = req.body;
    //instead of this we can send and object from the form rather than individual value

    let url = req.file.path;
    let filename = req.file.filename;
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;        //to create a owner
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "New listing saved")
    res.redirect("/listings");
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    // Prevent form data from directly overwriting image information
    delete req.body.listing.image;

    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { runValidators: true, new: true }
    );

    if (!updatedListing) {
        throw new ExpressError(404, "Listing not found");
    }

    // Run only when a new image is uploaded
    if (req.file) {
        // Remember the old image's Cloudinary public ID
        const oldFilename = updatedListing.image?.filename;

        // Get the new image information from Multer
        const url = req.file.path;
        const filename = req.file.filename;

        // Save the new image information in MongoDB
        updatedListing.image = { url, filename };
        await updatedListing.save();

        // Delete the old image if it belongs to our Cloudinary folder
        if (oldFilename?.startsWith("wanderlust_DEV/")) {
            try {
                await cloudinary.uploader.destroy(oldFilename);
            } catch (err) {
                console.error("Failed to delete old Cloudinary image:", err);
            }
        }
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