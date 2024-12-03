const { upcomingEvent } = require("../model/upcomingEvent-model");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");
const favoriteEvent = require('../model/favoriteEvent-model');
const { ObjectId } = require('mongoose').Types;
const { getDistance } = require('geolib');
const AllowLocation = require("../model/allowLocation-model");
const path = require('path');
const fs = require('fs');

exports.createUpcomingEvent = async (req, res) => {
    const files = req.files || [];
    console.log("Uploaded Files:", files);
    console.log("Request Body:", req.body);

    const { eventId, eventName, eventDate, eventTime, price, eventDescription, lat, long, location, totalSeats, eventType, eventGuideline, speakers } = req.body;

    // Initialize speakers array
    const speakersArray = [];

    // Process speakers data
    if (Array.isArray(speakers)) {
        for (let index = 0; index < speakers.length; index++) {
            const speakerName = speakers[index].speakerName;
            const speakerType = speakers[index].speakerType;
            const speakerImageFile = files.find(file => file.fieldname === `speakers[${index}][speakerImage]`);

            if (speakerName && speakerType) {
                speakersArray.push({
                    speakerName,
                    speakerType,
                    speakerImage: speakerImageFile.path, // Store image as Buffer
                });
            }
        }
    }

    // Validate required fields
    if (!eventId || !eventName || !eventDate || !price ||  !eventTime || !eventDescription || !lat || !long || !location || !totalSeats || !eventType || !eventGuideline) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: "Missing required fields.",
        });
    }

    if (speakersArray.length === 0) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: "No speakers provided.",
        });
    }

    try {
        if (!ObjectId.isValid(eventId)) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: constant.ERR_INVALID_EVENT_FORMAT,
            });
        }

        let existingCategory = await favoriteEvent.findOne({ _id: new ObjectId(eventId) });
        if (!existingCategory) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: constant.ERR_EVENT_EXISTS,
            });
        }

        let existingUpcomingEvent = await upcomingEvent.findOne({
            eventId,
            eventName,
            eventDate: new Date(eventDate),
        });
        if (existingUpcomingEvent) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: constant.EVENT_NAME_EXIST,
            });
        }

        const newSeats = Array.from({ length: totalSeats }, (_, i) => ({
            seatNumber: (i + 1).toString(),
            isBooked: false,
        }));

        const mainImageFile = files.find(file => file.fieldname === 'imageUrl').path;

     
        const newEvent = new upcomingEvent({
            eventId,
            eventName,
            eventDate: new Date(eventDate),
            price,
            eventTime,
            eventDescription,
            lat,
            long,
            location,
            imageUrl: mainImageFile,
            totalSeats,
            eventType,
            eventGuideline,
            speakers: speakersArray, 
            seats: newSeats,
        });

        await newEvent.save();
        return res.status(201).json({
            status: statusCode.OK,
             message: constant.DATA_CREATED,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: "An error occurred while creating the event.",
            error: error.message,
        });
    }
};


exports.deleteUpcomingEvent = async (req, res) => {
    const { id } = req.params;
    console.log("id" ,id)

    if (!id) {
        return res.status(400).json({ message: "Event ID is required." });
    }

    try {
        // Check if the event exists
        const event = await upcomingEvent.findById(id);
        if (!event) {
            return res.status(404).json({ message: "Event not found or already deleted." });
        }

        // Mark the event as deleted
        event.isDeleted = true;
        await event.save();

        return res.status(200).json({
            status: 200,
            message: "Event soft deleted successfully.",
            data: event,
        });
    } catch (error) {
        console.error("Error soft deleting event:", error);
        return res.status(500).json({
            message: "An internal server error occurred.",
            error: error.message,
        });
    }
};


exports.editUpcomingEvent = async (req, res) => {
    const { id } = req.params;
    const files = req.files || [];
    console.log("Uploaded Files:", files);

    const {
        eventName,
        eventDate,
        eventTime,
        price,
        eventDescription,
        lat,
        long,
        location,
        totalSeats,
        eventType,
        eventGuideline,
        speakers,
    } = req.body;

    // Validate required fields
    if (!eventName || !eventDate || !eventTime || !price || !eventDescription || !lat || !long || !location || !totalSeats || !eventType || !eventGuideline) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: "Missing required fields.",
        });
    }

    try {
        const existingEvent = await upcomingEvent.findOne({ _id: new ObjectId(id) });
        console.log("existingEvent" ,existingEvent)
        if (!existingEvent) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: "Event not found.",
            });
        }

        // Parse speakers data if sent as a string
        const speakersData = typeof speakers === "string" ? JSON.parse(speakers) : speakers || [];

        // Process speaker data
        const speakersArray = [];
        for (let index = 0; index < speakersData.length; index++) {
            const { speakerName, speakerType } = speakersData[index];
            const speakerImageFile = files.find(file => file.fieldname === `speakers[${index}][speakerImage]`);

            if (speakerName && speakerType) {
                speakersArray.push({
                    speakerName,
                    speakerType,
                    speakerImage: speakerImageFile ? speakerImageFile.path : null, // Use uploaded image path or null
                });
            }
        }

        // Handle main image upload
        const mainImageFile = files.find(file => file.fieldname === "imageUrl")?.path || existingEvent.imageUrl;

        // Update event fields
        existingEvent.eventName = eventName;
        existingEvent.eventDate = new Date(eventDate);
        existingEvent.eventTime = eventTime;
        existingEvent.price = price;
        existingEvent.eventDescription = eventDescription;
        existingEvent.lat = lat;
        existingEvent.long = long;
        existingEvent.location = location;
        existingEvent.totalSeats = totalSeats;
        existingEvent.eventType = eventType;
        existingEvent.eventGuideline = eventGuideline;
        existingEvent.speakers = speakersArray;
        existingEvent.imageUrl = mainImageFile;
        existingEvent.seats = Array.from({ length: totalSeats }, (_, i) => ({
            seatNumber: (i + 1).toString(),
            isBooked: false,
        }));

        await existingEvent.save();

        return res.status(200).json({
            status: statusCode.OK,
            message: constant.DATA_UPDATED,
            data: existingEvent,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: "An error occurred while updating the event.",
            error: error.message,
        });
    }
};



exports.getEventById = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await upcomingEvent.findById(id);
        if (!event) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: "Event not found.",
            });
        }

        return res.status(200).json({
            status: statusCode.OK,
            message: "Event details retrieved successfully.",
            data: event,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: "An error occurred while retrieving the event.",
            error: error.message,
        });
    }
};
exports.eventlist = async (req, res) => {
    const { eventCategory, eventDate } = req.body;
    try {
        // Start with a basic filter
        const filter = { isDeleted: false };

        // Log the initial filter

        // Apply additional filters only if they are provided
        if (eventCategory) {
            filter.eventId = eventCategory; 
        }
        if (eventDate) {
            filter.eventDate = new Date(eventDate); // Ensure correct date format
        }

        // Execute the query
        const response = await upcomingEvent.find(filter);

        return res.status(200).json({
            statusCode: statusCode.OK,
            data: response,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};


exports.eventById = async (req, res) => {

    try {
        const { id } = req.query;
        const response = await upcomingEvent.findById({ _id: new ObjectId(id) })
        return res.status(200).json({
            statusCode: statusCode.OK,
            data: response
        });
    } catch {
        return res.status(500).json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }


}


//Mobile:



exports.eventListMobile = async (req, res) => {

    try {

        const today = new Date();

        const response = await upcomingEvent.find({
            eventDate: {
                $gte: today
            }, 
            isDeleted: false 
        
        })
        return res.status(200).json({
            statusCode: statusCode.OK,
            data: response
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }


}

exports.nearByEvent = async (req, res) => {
    try {
        const { userId } = req.body;

        // Fetch user location
        let userLocation = await AllowLocation.findOne({ userId: new ObjectId(userId) });

        // Check if userLocation exists
        if (!userLocation) {
            return res.status(404).json({
                statusCode: 404,
                message: "User location not found.",
            });
        }

        const { lat, long } = userLocation;

        // Fetch events
        const today = new Date();
        const events = await upcomingEvent.find({
            eventDate: { $gte: today },
        });

        // Filter nearby events
        const nearbyEvents = events.filter(event => {
            if (!event.lat || !event.long) {
                return false; // Skip events without location data
            }

            const distance = getDistance(
                { latitude: lat, longitude: long },
                { latitude: event.lat, longitude: event.long }
            );
            return distance <= 10000; // 10 kilometers in meters
        });

        // Respond with nearby events
        return res.status(200).json({
            statusCode: 200,
            nearByEvents: nearbyEvents,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            statusCode: 500,
            message: "Internal server error.",
        });
    }
};
