const { seatBooking } = require("../model/seatBooking-model");
const { upcomingEvent } = require("../model/upcomingEvent-model");
const register = require('../model/user-model');
const favoriteEvent = require("../model/favoriteEvent-model")
const statusCode = require("../utlis/statusCode");
const { ObjectId } = require("mongodb");
const constant = require("../utlis/constant");




const stripe = require('stripe')('sk_test_51QA30s01ibCFPc6hXnuYRZ69dlpnRRRigERkjKjjVsH4lIOb0EGdRN33LHeJBl7yn7NYnaIWQ7B1WGFAmuKvluD2009EHQug1h');

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
        const eventName = await upcomingEvent.findById({ _id: eventId });
        const userName = await register.findById({ _id: userId })

        console.log("eventcategory", eventName.eventId)



        const date = new Date();
        const newBooking = new seatBooking({
            eventId,
            userId,
            seatsBooked,
            totalPrice,
            bookingDate: date.toISOString().split("T")[0],
            paymentStatus: 'Unpaid',

        });




        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPrice,
            currency: 'usd',

            metadata: {

                user_id: userId,
                event_id: eventId,
                seats_booked: JSON.stringify(seatsBooked),
                eventName: eventName.eventName,
                userName: userName.userName,
            },
            automatic_payment_methods: { enabled: true }
        });
        console.log("hhhhhhhh", paymentIntent)
        newBooking.paymentIntentId = paymentIntent.id; // Save the payment intent ID
        await newBooking.save();

        res.status(201).json({
            status: statusCode.CREATED,
            message: constant.DATA_CREATED,
            data: {
                booking: newBooking,
                clientSecret: paymentIntent.client_secret,
            },
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};
exports.cancelAndRefundBooking = async (req, res) => {
    const { bookingId, refund, userId } = req.body;

    console.log("Request Body: ", req.body); // Log the incoming request

    // Validate the required bookingId field
    if (!bookingId) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: "Booking ID is required.",
        });
    }

    try {
        // Fetch the booking by ID
        const booking = await seatBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: "Booking not found.",
            });
        }

        console.log("Booking Details: ", booking); // Log booking details for debugging

        // Update the booking status to 'Cancelled'
        booking.paymentStatus = 'Cancelled';
        await booking.save();

        const event = await upcomingEvent.findById(booking.eventId);
        if (event) {
            booking.seatsBooked.forEach(seat => {
                const seatInfo = event.seats.find(s => s.seatNumber === seat);
                if (seatInfo) {
                    seatInfo.isBooked = false; // Mark seat as available
                    seatInfo.bookedBy = null; // Clear bookedBy field
                }
            });
            console.log("event" ,event)
            await event.save(); // Save updated event
        }

        // Process refund if requested
        if (refund) {
            try {
                const refundIntent = await stripe.refunds.create({
                    payment_intent: booking.paymentIntentId, // Ensure this ID is valid in Stripe
                });

                // Check if the refund succeeded
                if (refundIntent.status === 'succeeded') {
                    console.log("Refund processed successfully: ", refundIntent); // Log refund details
                    return res.status(200).json({
                        status: statusCode.OK,
                        message: "Booking cancelled and refund processed successfully.",
                        data: booking,
                    });
                } else {
                    return res.status(500).json({
                        status: statusCode.INTERNAL_SERVER_ERROR,
                        message: "Refund failed. Please contact support.",
                    });
                }
            } catch (refundError) {
                console.error("Error during refund processing: ", refundError); // Log refund error
                return res.status(500).json({
                    status: statusCode.INTERNAL_SERVER_ERROR,
                    message: "An error occurred while processing the refund. Please try again later.",
                });
            }
        }

        // If no refund is requested
        return res.status(200).json({
            status: statusCode.OK,
            message: "Booking cancelled without refund.",
            data: booking,
        });

    } catch (error) {
        console.error("Error processing cancellation: ", error); // Log general errors
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: "An error occurred while processing the cancellation. Please try again later.",
        });
    }
};


exports.paymentDetails = async (req, res) => {
    const { bookingId } = req.query;
    console.log("hai")
    console.log("req.query", req.query)

    try {
        const tempBooking = await seatBooking.findById(bookingId);
        if (!tempBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        console.log("tempBooking", tempBooking)
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


// customer list api
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

//// Cancel a booking
exports.cancelSeatBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Find the booking to be canceled
        const booking = await seatBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: constant.ERR_BOOKING_NOT_FOUND,
            });
        }
        // Update seat status in the associated event
        const event = await upcomingEvent.findById(booking.eventId);
        if (event) {
            booking.seatsBooked.forEach(seat => {
                const seatInfo = event.seats.find(s => s.seatNumber === seat);
                if (seatInfo) {
                    seatInfo.isBooked = false; // Mark seat as available
                    seatInfo.bookedBy = null; // Clear bookedBy field
                }
            });
            console.log("event" ,event)
            await event.save(); // Save updated event
        }

        // Delete the booking
        booking.paymentStatus = 'Refunded'; // Update status to refunded
        await booking.save();

        return res.status(200).json({
            status: statusCode.OK,
            message: constant.DATA_DELETED,
            data: booking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};

//transaction list
exports.transactionList = async (req, res) => {
    const { eventCategory, eventDate } = req.body; // Assuming you're sending these in the request body
    console.log("req.body", req.body);

    try {
        // Build the filter object
        const filter = {};
        let bookings;

        // Check if eventCategory is valid
        if (eventCategory && ObjectId.isValid(eventCategory)) {
            const upcoming = await upcomingEvent.findOne({ eventId: new ObjectId(eventCategory) });

            if (upcoming) {
                // If eventDate is provided, filter by both eventId and bookingDate
                if (eventDate) {
                    const parsedDate = new Date(eventDate);
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
                    console.log("bookings" ,bookings)
                } else {
                    // If only eventCategory is provided, filter by eventId
                    bookings = await seatBooking.find({ eventId: upcoming._id });
                }
            } else {
                console.log("No upcoming event found for the provided event category.");
                bookings = [];
            }
        } else if (eventDate) {
            // If only eventDate is provided, filter by bookingDate
            const parsedDate = new Date(eventDate);
            if (isNaN(parsedDate)) {
                return res.status(400).json({
                    status: statusCode.BAD_REQUEST,
                    message: "Invalid date format."
                });
            }
            bookings = await seatBooking.find({ bookingDate: parsedDate });
            console.log("bookings" ,bookings)
        } else {
            // If both eventCategory and eventDate are empty, fetch all bookings
            bookings = await seatBooking.find({});
            console.log("Fetching all bookings");
        }

        // Check if any bookings were found
        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                status: statusCode.OK,
                data: [],
                message: "No bookings found."
            });
        }

        // Fetch user and event details for each booking
        const bookingDetails = await Promise.all(
            bookings.map(async (booking) => {
                const eventDetails = await upcomingEvent.findById(booking.eventId);
                const userDetails = await register.findById(booking.userId);

                return {
                    ...booking.toObject(),
                    eventName: eventDetails ? eventDetails.eventName : null,
                    customerName: userDetails ? userDetails.userName : null,
                    totalPrice: (booking.totalPrice / 100).toFixed(2), // Convert to dollars
                    seatsBooked: booking.seatsBooked, // Include booked seats
                    paymentStatus: booking.paymentStatus, // Include payment status
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
            message: "An error occurred while fetching booking details.",
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

exports.getSeatBookingStatus = async (req, res) => {
    try {
      // Fetch all seat bookings
      const seatBookings = await seatBooking.find({});
  
      // Count the number of bookings for each status
      const totalEvents = seatBookings.length;
      const completedEvents = seatBookings.filter(booking => booking.paymentStatus === 'Paid').length;
      const pendingEvents = seatBookings.filter(booking => booking.paymentStatus === 'Unpaid').length;
      const cancelledEvents = seatBookings.filter(booking => booking.paymentStatus === 'Cancelled').length;
  
      return res.status(200).json({
        status: statusCode.OK,
        data: {
          totalEvents,
          completedEvents,
          pendingEvents,
          cancelledEvents,
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
  


//mobile
exports.ticketBookingStatus = async (req, res) => {
    const { userId } = req.body;

    console.log(req.body);

    try {
        // Fetch seat bookings for the user
        const seatBookings = await seatBooking.find({ userId: userId, paymentStatus: { $ne: 'Cancelled' } }); // Exclude cancelled bookings
        console.log("Seat Bookings: ", seatBookings);

        // Check if there are any active bookings
        if (seatBookings.length === 0) {
            return res.status(404).json({
                status: statusCode.NOT_FOUND,
                message: 'No active bookings found for this user.',
            });
        }

        // Fetch upcoming events based on eventId from active bookings
        const eventIds = seatBookings.map(booking => booking.eventId);
        const upcomingEvents = await upcomingEvent.find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } });

        // Get the current date
        const currentDate = new Date();

        // Separate events into completed and pending
        const completedEvents = upcomingEvents.filter(event => new Date(event.eventDate) < currentDate);
        const pendingEvents = upcomingEvents.filter(event => new Date(event.eventDate) >= currentDate);

        // Create a response structure for completed events
        const completedResponse = completedEvents.map(event => {
            const bookingDetails = seatBookings.filter(booking => booking.eventId === event._id.toString());
            return {
                eventId: event._id,
                eventName: event.eventName,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                imageUrl: event.imageUrl,
                location: event.location,
                bookingDetails: bookingDetails.map(booking => ({
                    seatBookingId: booking._id,
                    seatsBooked: booking.seatsBooked,
                    totalPrice: booking.totalPrice,
                    bookingDate: booking.bookingDate,
                    paymentStatus: booking.paymentStatus,
                })),
            };
        });

        // Create a response structure for pending events
        const pendingResponse = pendingEvents.map(event => {
            const bookingDetails = seatBookings.filter(booking => booking.eventId === event._id.toString());
            return {
                eventId: event._id,
                eventName: event.eventName,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                imageUrl: event.imageUrl,
                location: event.location,
                bookingDetails: bookingDetails.map(booking => ({
                    seatBookingId: booking._id,
                    seatsBooked: booking.seatsBooked,
                    totalPrice: booking.totalPrice,
                    bookingDate: booking.bookingDate,
                    paymentStatus: booking.paymentStatus,
                })),
            };
        });

        // Log the completed and pending responses with JSON.stringify for better readability
        console.log("Completed Events: ", JSON.stringify(completedResponse, null, 2));
        console.log("Pending Events: ", JSON.stringify(pendingResponse, null, 2));

        // Respond with the booking status along with completed and pending events
        return res.status(200).json({
            status: statusCode.OK,
            completedEvents: completedResponse,
            pendingEvents: pendingResponse,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};
