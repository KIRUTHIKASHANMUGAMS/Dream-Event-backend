const dashboard = require('../model/dashboard-model');
const { ObjectId } = require("mongodb");
const statusCode = require("../utlis/statusCode");
const register = require('../model/user-model');
const constant = require("../utlis/constant");
const { upcomingEvent }  = require("../model/upcomingEvent-model");
const { seatBooking } = require("../model/seatBooking-model");

exports.dashboard = async (req, res) => {
    try {
        const totalUsers = await register.countDocuments({});
        const totalEvents = await upcomingEvent.countDocuments({});
        const totalTickets = await seatBooking.countDocuments({ paymentStatus: "Paid" });

        // Get the start and end of the current day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Calculate total revenue from today's paid bookings
        const totalRevenueData = await seatBooking.aggregate([
            { $match: { paymentStatus: "Paid", } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
        ]);



        const totalRevenue = totalRevenueData[0] ? totalRevenueData[0].totalRevenue : 0;

        // Fetch latest sales and find the latest event ID
        const latestSales = await seatBooking.find({ paymentStatus: "Paid" }).sort({ bookingDate: -1 }).limit(1);
        let latestEventDetails = null;

        if (latestSales.length > 0) {
            // Get event ID of the latest sale
            const latestEventId = latestSales[0].eventId;
            latestEventDetails = await upcomingEvent.findById(new ObjectId(latestEventId));
        }

        // Calculate the count of tickets sold today
        const ticketSoldByToday = await seatBooking.countDocuments({
            paymentStatus: "Paid",
            bookingDate: { $gte: startOfDay }
        });
        const date = new Date();
        const pastDate = new Date(date);
        pastDate.setDate(pastDate.getDate() - 30); // 30 days in the past

        const recentEvents = await upcomingEvent.find({
            eventDate: {
                $gte: pastDate,

            },
            isDeleted: false
        });

        const trendingEvents = await upcomingEvent.find({isDeleted: false})
        const sortedEvents = trendingEvents.map(event => {
            const bookedSeatsCount = event.seats.filter(seat => seat.isBooked).length;
            return {
                ...event.toObject(),
                bookedSeatsCount,
            };
        }).sort((a, b) => b.bookedSeatsCount - a.bookedSeatsCount);

        const trendingEventList = sortedEvents.map(event => ({
            _id:event._id,
            eventId: event.eventId,
            eventName: event.eventName,
            bookedSeatsCount: event.bookedSeatsCount,
            eventDate: event.eventDate,
            totalSeats:event.totalSeats,
            eventTime: event.eventTime,
            location: event.location,
            imageUrl: event.imageUrl,
        }));

        res.status(statusCode.OK).json({
            status: statusCode.OK,
            message: constant.SUCCESS,
            data: {
                totalUsers,
                totalEvents,
                totalTickets,
                totalRevenue,
                ticketSoldByToday,
                recentEvents,
                trendingEventList,
                latestSales: latestEventDetails
                    ? [
                        {
                            eventName: latestEventDetails.eventName,
                            location: latestEventDetails.location,
                            eventDate: latestEventDetails.eventDate,
                            eventImage: latestEventDetails.imageUrl
                        }
                    ]
                    : null
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};


exports.totalEvents = async (req, res) => {
    try {
        const { date, category } = req.body;

        let query = {

        };

        // If category is provided, add it to the query
        if (category) {
            query.eventId = category;
        }

        // If date is provided, filter by month and year
        if (date) {
            const parsedDate = new Date(date);
            const year = parsedDate.getFullYear();
            const month = parsedDate.getMonth(); // 0-indexed

            // Create start and end dates for the month
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 1); // first day of the next month

            // Filter by eventDate if date is provided
            query.eventDate = { $gte: startDate, $lt: endDate };
        }

        // Fetch finished events based on the constructed query
        const events = await upcomingEvent.find(query);

        // Calculate total tickets sold for filtered events
        const totalTicketsSold = events.reduce((total, event) =>
            total + event.seats.filter(seat => seat.isBooked).length, 0
        );

        // Fetch all past events that match the category if provided
        const pastEventsQuery = { endDate: { $lte: new Date() } };
        if (category) {
            pastEventsQuery.eventId = category;
        }

        const pastEvents = await upcomingEvent.find(pastEventsQuery);
        const totalEventHeld = pastEvents.length;

        // Calculate total tickets left for filtered events
        const totalTicketsLeft = events.reduce((total, event) =>
            total + event.totalSeats - event.seats.filter(seat => seat.isBooked).length, 0
        );

        res.json({
            ticketsSold: totalTicketsSold,
            eventHeld: totalEventHeld,
            ticketsLeft: totalTicketsLeft,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.salesRevenue = async (req, res) => {
    const { date } = req.body;

    let yearFilter = null;

    if (date) {
        const parsedDate = new Date(date);
        yearFilter = parsedDate.getFullYear(); // Get the year from the provided date
    }

    try {
        const totalRevenueData = await seatBooking.find({ paymentStatus: "Paid" });
        console.log(totalRevenueData);

        // Calculate total revenue by year and month
        const revenueByYearMonth = totalRevenueData.reduce((acc, booking) => {
            const bookingDate = new Date(booking.bookingDate);
            const year = bookingDate.getFullYear();
            const month = bookingDate.getMonth() + 1; // getMonth() is 0-indexed, so add 1 for 1-based month

            // If a year filter is set, only include bookings from that year
            if (yearFilter && year !== yearFilter) {
                return acc; // Skip this booking if it doesn't match the year filter
            }

            // Initialize year and month if they don't exist
            if (!acc[year]) {
                acc[year] = {};
            }
            if (!acc[year][month]) {
                acc[year][month] = 0;
            }

            // Add the totalPrice to the corresponding year and month
            acc[year][month] += booking.totalPrice;
            return acc;
        }, {});

        // Convert the revenueByYearMonth object to an array of { year, month, totalPrice }
        const formattedRevenue = [];
        for (const [year, months] of Object.entries(revenueByYearMonth)) {
            for (const [month, totalPrice] of Object.entries(months)) {
                formattedRevenue.push({
                    year: parseInt(year),
                    month: parseInt(month),
                    totalPrice
                });
            }
        }

        res.json({
            totalRevenue: formattedRevenue // Return the formatted revenue data
        });
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.upcomingEventList = async (req, res) => {
    try {
        const { date } = req.body;

        let events;

        if (date) {
            // Parse the provided date
            const filterDate = new Date(date);

            const startOfDay = new Date(filterDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(filterDate);
            endOfDay.setHours(23, 59, 59, 999);

            // If a date is provided, filter events for that specific day
            events = await upcomingEvent.find({
                eventDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else {
          
            events = await upcomingEvent.find({
                eventDate: {
                    $gte: new Date()
                }
            });
        }

      
        res.status(200).json({
            status: 200,
            data: events
        });
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};



