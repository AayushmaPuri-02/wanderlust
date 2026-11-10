const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js")

const listingSchema = new Schema({
    title : {
        type:String,
        required : true
    },
    description: {
        type : String,
    },
    price: {
        type : Number,
    },
    location :{
        type : String
    },
    country: {
        type : String,
    },
    image : {
        type : String,
        default : "https://images.unsplash.com/photo-1679364297777-1db77b6199be?q=80&w=3271&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" ,
        set : (v) => v ==="" ? "https://images.unsplash.com/photo-1679364297777-1db77b6199be?q=80&w=3271&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" : v ,
    },
    reviews:[
        {
            type : Schema.Types.ObjectId,
            ref : "Review",
        }
    ],
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User",
    }
})

listingSchema.post("findOneAndDelete", async(listing)=>{
    if(listing){
         await Review.deleteMany({_id : {$in : listing.reviews}})
    }
   
})
const Listing = mongoose.model("Listing", listingSchema );
module.exports = Listing;