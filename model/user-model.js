const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    userName:{type:String,required:true,trim:true},
    email:{type:String,required:true,trim:true},
    password:{type:String,required:true,trim:true},
    token:{type:String,trim:true},
    otp:{type:String , trim:true},
    expiresAt:{type:String,trim:true},
     
});


module.exports=mongoose.model("register",userSchema);