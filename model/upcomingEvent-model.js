const mongoose = require("mongoose")
const speakerSchema = new mongoose.Schema({
    speakerName: { type: String, required: true },
    speakerType: { type: String, required: true },
    speakerImage: { type: String }, // Store image as Buffer
});
const upcomingEventSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventName: { type: String, required: true, },
    eventDate: { type: Date, required: true, },
    eventTime: { type:String, required: true, },
    price: { type: Number, required: true },
    eventDescription: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
    location:{type: String, required: true},
    imageUrl: { type: String},
    totalSeats: { type: Number, required: true },
    eventType: { type: String, required: true },
    eventGuideline: { type: String, required: true },
    speakers: [speakerSchema ],

    seats: [{
        seatNumber: { type: String },
        isBooked: { type: Boolean, default: false },
        bookedBy: { type: String }
    }]



})


const upcomingEvent = mongoose.model('upcomingEvent', upcomingEventSchema);
module.exports = { upcomingEvent }; 
