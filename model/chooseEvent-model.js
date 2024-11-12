const mongoose=require("mongoose")

const chooseEventSchema=new mongoose.Schema({
    userId:{type:String,required:true},
    events: { type: [String], required: true }

})

const chooseEvent = mongoose.model('ChooseEvent', chooseEventSchema);

module.exports = { chooseEvent };