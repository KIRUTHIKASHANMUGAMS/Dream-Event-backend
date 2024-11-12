const mongoose=require("mongoose")

const dashboardSchema=new mongoose.Schema({
    totalEvents:{type:Number,required:true},
    userRegistrations:{type:Number,required:true},
    totalTicketsSold :{type:Number,required:true},
    totalRevenue :{type:Number,required:true},

})

const dashboard = mongoose.model('dashbord', dashboardSchema);

module.exports = { dashboard };