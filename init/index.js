const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../models/listing");
const { init } = require("../models/review");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust"
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async ()=>{
    await Listing.deleteMany({});
    initData.data =  initData.data.map((obj)=> ( {...obj , owner : "6ae2e4415b56180a8284d4f2"}));
    await Listing.insertMany(initData.data);
    console.log("Data was saved successfully");
}

initDB();