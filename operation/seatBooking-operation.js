const { seatBooking } = require("../model/seatBooking-model");
const { upcomingEvent } = require("../model/upcomingEvent-model");
const register = require('../model/user-model');
const favoriteEvent = require("../model/favoriteEvent-model")
const statusCode = require("../utlis/statusCode");
const { ObjectId } = require("mongodb");
const constant = require("../utlis/constant");




const stripe = require('stripe')('sk_test_51QA30s01ibCFPc6hXnuYRZ69dlpnRRRigERkjKjjVsH4lIOb0EGdRN33LHeJBl7yn7NYnaIWQ7B1WGFAmuKvluD2009EHQug1h');
const YOUR_DOMAIN = 'http://localhost:8081/ '; // Change to your domain in production

exports.createSeatBooking = async (req, res) => {
    const { eventId, userId, seatsBooked } = req.body;

    // Validate input data
    if (!eventId || !userId || !Array.isArray(seatsBooked)) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: constant.ERR_FIRST_NAME,
        });
    }

    try {
        const event = await upcomingEvent.findById(new ObjectId(eventId));
        if (!event) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: "Event not found.",
            });
        }

        const unavailableSeats = seatsBooked.filter(seat =>
            event.seats.find(s => s.seatNumber === seat && s.isBooked)
        );

        if (unavailableSeats.length > 0) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: `The following seats are already booked: ${unavailableSeats.join(', ')}`,
            });
        }

        const bookedSeats = [];
        seatsBooked.forEach(seat => {
            const seatInfo = event.seats.find(s => s.seatNumber === seat);
            if (seatInfo) {
                bookedSeats.push(seatInfo.seatNumber);
            }
        });

        const totalPrice = bookedSeats.length * parseFloat(event.price) * 100; 
        console.log("totalPrice", totalPrice);
        if (isNaN(totalPrice) || totalPrice <= 0) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: "Total price calculation failed.",
            });
        }
        const eventName = await upcomingEvent.findById({_id:eventId});
        const userName= await register.findById({_id:userId})
    
        console.log("eventcategory" , eventName.eventId)


        
        const date  = new Date();       
         const newBooking = new seatBooking({
            eventId,
            userId,
            seatsBooked,
            totalPrice,
            bookingDate:date.toISOString().split("T")[0],
            paymentStatus: 'Unpaid',
        });
       

        await newBooking.save();
        

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Dream Event',
                        },
                        unit_amount: totalPrice,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}paymentSuccessfully?redirect=true`,
            cancel_url: `${YOUR_DOMAIN}?canceled=true`,
            payment_intent_data: {
                metadata: {
                    user_id: userId,
                    event_id: eventId,
                    
                    seats_booked: JSON.stringify(seatsBooked),
                    eventName: eventName.eventName,
                    userName: userName.userName,
                    eventCategory:eventName.eventId.toString()
                },
            },
        });
        
        res.status(201).json({
            status: statusCode.CREATED,
            message: constant.DATA_CREATED,
            data: {
                booking: newBooking,
                url: session.url, 
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};

exports.paymentDetails = async (req, res) => {
    const { bookingId } = req.query;

    console.log("req.query", req.query)

    try {
        const tempBooking = await seatBooking.findById(bookingId);
        if (!tempBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        tempBooking.paymentStatus = 'Paid';

        // Update seat status
        const event = await upcomingEvent.findById(tempBooking.eventId);
        if (event) {
            tempBooking.seatsBooked.forEach(seat => {
                const seatInfo = event.seats.find(s => s.seatNumber === seat);
                if (seatInfo) {
                    seatInfo.isBooked = true; 
                    seatInfo.bookedBy = tempBooking.userId;
                }
            });
            await event.save(); // Save updated event
        }

        // Update payment status and save final booking
        tempBooking.paymentStatus = 'Paid';
        await tempBooking.save();

        res.json({ message: "Booking confirmed!", bookingId: tempBooking._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.getBookingDetails = async (req, res) => {
    const { eventCategory, date } = req.body;

    try {
        let bookings;

        // Check for both filters first
        if (eventCategory && date) {
            const upcoming = await upcomingEvent.findOne({ eventId: eventCategory });
            if (upcoming) {
                bookings = await seatBooking.find({
                    eventId: upcoming._id,
                    bookingDate: date,
                });
            } else {
                bookings = [];
            }
        } else if (eventCategory) {
            const upcoming = await upcomingEvent.findOne({ eventId: eventCategory });
            if (upcoming) {
                bookings = await seatBooking.find({
                    eventId: upcoming._id,
                });
            } else {
                bookings = [];
            }
        } else if (date) {
            bookings = await seatBooking.find({ bookingDate: date });
        } else {
            bookings = await seatBooking.find({});
        }

        const bookingDetails = await Promise.all(
            bookings.map(async (booking) => {
                const eventDetails = await upcomingEvent.findOne({ _id: booking.eventId });
                const userDetails = await register.findOne({ _id: booking.userId });

                return {
                    ...booking.toObject(),
                    eventName: eventDetails ? eventDetails.eventName : null,
                    location: eventDetails ? eventDetails.location : null,
                    customerName: userDetails ? userDetails.userName : null,
                };
            })
        );

        return res.status(200).json({
            status: statusCode.OK,
            data: bookingDetails,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};



exports.customerList = async (req, res) => {
    const { eventCategory, date } = req.body;

    try {
        let bookings;

        // If both eventCategory and date are provided, filter accordingly
        if (eventCategory && ObjectId.isValid(eventCategory)) {
            const upcoming = await upcomingEvent.findOne({ eventId: new ObjectId(eventCategory) });

            if (upcoming) {
                if (date) {
                    const parsedDate = new Date(date);
                    if (isNaN(parsedDate)) {
                        return res.status(400).json({
                            status: statusCode.BAD_REQUEST,
                            message: "Invalid date format."
                        });
                    }
                    bookings = await seatBooking.find({
                        eventId: upcoming._id,
                        bookingDate: parsedDate
                    });
                } else {
                    bookings = await seatBooking.find({
                        eventId: upcoming._id,
                    });
                }
            } else {
                console.log("No upcoming event found for the provided event category.");
                bookings = [];
            }
        } else if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) {
                return res.status(400).json({
                    status: statusCode.BAD_REQUEST,
                    message: "Invalid date format."
                });
            }
            bookings = await seatBooking.find({
                bookingDate: parsedDate
            });
        } else {
            // If both eventCategory and date are empty, fetch all bookings
            bookings = await seatBooking.find({});
            console.log("Fetching all bookings");
        }

        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                status: statusCode.OK,
                data: [],
                message: "No bookings found."
            });
        }

        const userIds = [...new Set(bookings.map(booking => booking.userId))];
        const eventIds = [...new Set(bookings.map(booking => booking.eventId))];

        const users = await register.find({ _id: { $in: userIds } });
        const eventDetails = await upcomingEvent.find({ _id: { $in: eventIds } });

        const userMap = users.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
        }, {});

        const eventMap = eventDetails.reduce((acc, event) => {
            acc[event._id] = event;
            return acc;
        }, {});

        const bookingDetailsWithCustomers = bookings.map(booking => {
            const userDetails = userMap[booking.userId] || {};
            const eventMapDetails = eventMap[booking.eventId] || {};

            return {
                ...booking.toObject(),
                customerName: userDetails.userName || null,
                customerEmail: userDetails.email || null,
                location: eventMapDetails.location || null,
                eventName: eventMapDetails.eventName || null,
          
            };
        });

        return res.status(200).json({
            status: statusCode.OK,
            data: bookingDetailsWithCustomers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};


// Retrieve all bookings for a specific user
exports.getUserBookings = async (req, res) => {
    const { userId } = req.body;

    try {
        const bookings = await seatBooking.find({ userId: userId });
        return res.status(200).json({
            status: statusCode.OK,
            data: bookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};



// Delete a booking
exports.deleteSeatBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        const deletedBooking = await seatBooking.findByIdAndDelete(bookingId);
        if (!deletedBooking) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: constant.ERR_BOOKING_NOT_FOUND,
            });
        }

        return res.status(200).json({
            status: statusCode.OK,
            message: constant.DATA_DELETED,
            data: deletedBooking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};


//mobile

exports.ticketBookingStatus = async (req, res) => {
    const { userId } = req.body;

    try {
        // Fetch seat bookings for the user
        const seatBookings = await seatBooking.find({ userId: userId });

        // Check if there are any bookings
        if (seatBookings.length === 0) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: 'No bookings found for this user.',
            });
        }

        // Fetch upcoming events based on eventId from bookings
        const eventIds = seatBookings.map(booking => booking.eventId);
        const upcomingEvents = await upcomingEvent.find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } });

        // Get the current date
        const currentDate = new Date();

        // Separate events into completed and pending
        const completedEvents = [];
        const pendingEvents = [];

        upcomingEvents.forEach(event => {
            if (new Date(event.eventDate) < currentDate) {
                completedEvents.push(event);
            } else {
                pendingEvents.push(event);
            }
        });
        

        // Respond with the booking status and categorized events
        return res.status(200).json({
            status: statusCode.OK,
            completed: completedEvents,
            pending: pendingEvents,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};