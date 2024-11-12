const mongoose=require("mongoose")

const allowLocationSchema=new mongoose.Schema({
    userId:{type:String, required:true},
    lat:{type:Number,required:true},
    long:{type:Number , required:true}
}, { timestamps: true });


const AllowLocation=mongoose.model("allowLocation" ,allowLocationSchema) ;
module.exports = AllowLocation;