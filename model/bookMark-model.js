const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User-model' // Assuming you have a User model
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'upcomingEvent-model' 
    }
}, { timestamps: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;
