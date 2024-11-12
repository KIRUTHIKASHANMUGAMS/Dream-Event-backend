const { upcomingEvent } = require("../model/upcomingEvent-model");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant").default;
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
            status: statusCode.CREATED,
            message: constant.DATA_CREATED,
            data: newEvent,
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




exports.eventlist = async (req, res) => {
    const { eventCategory, eventDate } = req.body;
    try {
       
        const filter = {};

       
        if (eventCategory) {
            filter.eventId = eventCategory; 
        }
        if (eventDate) {
            filter.eventDate = eventDate; 
        }

        const response = await upcomingEvent.find();


        

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
            }
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
        const { userId } = req.body


        let userLocation = await AllowLocation.findOne({ userId: new ObjectId(userId) });

        const today = new Date();
        const { lat, long } = userLocation;

        const events = await upcomingEvent.find({
            eventDate: {
                $gte: today
            }
        });

        const nearbyEvents = events.filter(event => {
            const distance = getDistance(
                { latitude: lat, longitude: long },
                { latitude: event.lat, longitude: event.long } // Ensure these fields exist in your event model
            );
            return distance <= 10000; // 10 kilometers in meters
        });

        console.log("nearbyEvents", nearbyEvents);

        return res.status(200).json({
            statusCode: statusCode.OK,
            nearByEvents: nearbyEvents
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }

}



