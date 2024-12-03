const mongoose = require("mongoose");

const seatBookingSchema = new mongoose.Schema({
    eventId: { type: String ,required:true },
    userId: { type: String ,required:true },
    seatsBooked: { type: [String] ,required:true },
    totalPrice:{type:Number},
    bookingDate: { type: Date, default: Date.now() } ,
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Cancelled'], default: 'Unpaid' }, // Add paymentStatus field
    paymentIntentId:{type:String ,required:true }




   
})

const seatBooking = mongoose.model('seatBooking', seatBookingSchema);
module.exports = { seatBooking }; 