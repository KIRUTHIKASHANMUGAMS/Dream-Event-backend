const Bookmark = require('../model/bookMark-model');
const { upcomingEvent } = require("../model/upcomingEvent-model");


// Add a bookmark
exports.bookmark = async (req, res) => {
    const { userId, eventId } = req.body;
    try {
        const existingBookmark = await Bookmark.findOne({ userId, eventId });
        if (existingBookmark) {
            return res.status(400).json({ message: 'Bookmark already exists' });
        }

        const bookmark = new Bookmark({ userId, eventId });
        await bookmark.save();
        res.status(201).json({ message: 'Bookmark added', bookmark });
    } catch (error) {
        res.status(500).json({ message: 'Error adding bookmark', error });
    }
}

// Remove a bookmark
exports.removeBookmark = async (req, res) => {
    const { id } = req.query;

    try {
        await Bookmark.findByIdAndDelete(id);
        console.log("hai")
        res.status(200).json({ message: 'Bookmark removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing bookmark', error });
    }
}

// Fetch bookmarks for a user
exports.bookmarkById = async (req, res) => {
    const { userId } = req.query;

    try {
        const bookmarks = await Bookmark.find({ userId });

        // Wait for all event details asynchronously
        const result = await Promise.all(bookmarks.map(async (bookmark) => {
            const event = await upcomingEvent.findById(bookmark.eventId); // Use await here
            
            // Merge bookmark and event details in one object
            return {
                ...bookmark.toObject(),  // Spread bookmark fields
                imageUrl:event.imageUrl,
                eventId:event._id,
                eventName: event.eventName,
                eventDate: event.eventDate,
                location: event.location
            };
        }));

        // Send bookmarks and event details together in the response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookmarks', error });
    }
};
