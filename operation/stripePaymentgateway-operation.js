const stripe = require('stripe')('sk_test_51QA30s01ibCFPc6hXnuYRZ69dlpnRRRigERkjKjjVsH4lIOb0EGdRN33LHeJBl7yn7NYnaIWQ7B1WGFAmuKvluD2009EHQug1h');
const YOUR_DOMAIN = 'http://localhost:8000';
const constant = require("../utlis/constant");
const statusCode = require("../utlis/statusCode");

exports.getStripePayment = async (req, res) => {
    const { unit_amount, currency } = req.body;

    try {
        // Create a new price object dynamically
        const price = await stripe.prices.create({
            unit_amount: unit_amount,
            currency: "usd",
            product_data: {
                name: 'Dream Event',
            },
        });

        // Create a checkout session with the newly created price
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}?success=true`,
            cancel_url: `${YOUR_DOMAIN}?canceled=true`,
            payment_method_types: ['card', 'paypal'],
        });

        res.json({ url: session.url }); // Send the session URL back to the client
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.stripePayment = async (req, res) => {
    const { eventCategory, date } = req.body; 

    // Input validation
    if (eventCategory && typeof eventCategory !== 'string') {
        return res.status(400).json({
            status: 400,
            message: "Invalid event category",
        });
    }
    
    if (date && isNaN(Date.parse(date))) {
        return res.status(400).json({
            status: 400,
            message: "Invalid date format. Please use YYYY-MM-DD.",
        });
    }

    try {
        // List payment intents
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 100, // Adjust limit if necessary
        });

        // Convert input date to a timestamp range for filtering
        let startTimestamp, endTimestamp;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0); // Start of the day
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999); // End of the day
            startTimestamp = Math.floor(startDate.getTime() / 1000);
            endTimestamp = Math.floor(endDate.getTime() / 1000);
        }

        // Filter payment intents
        const filteredPaymentIntents = await Promise.all(paymentIntents.data.map(async (intent) => {
            const matchesCategory = eventCategory
                ? intent.metadata.eventCategory === eventCategory
                : true;

            const matchesDate = date
                ? intent.created >= startTimestamp && intent.created <= endTimestamp
                : true;

            if (matchesCategory && matchesDate) {
                // Retrieve refunds for the payment intent
                const refunds = await stripe.refunds.list({
                    payment_intent: intent.id,
                });

                // Return the payment intent with associated refund details
                return {
                    paymentIntent: intent,
                    refunds: refunds.data, // Include the refunds in the response
                };
            }
        }));

        // Filter out any undefined results (if they didn't match the category/date)
        const result = filteredPaymentIntents.filter(intent => intent !== undefined);

        res.status(200).json({
            status: 200,
            message: "Data retrieved successfully",
            data: result,
        });
    } catch (error) {
        console.error('Error retrieving payment intents:', error);
        res.status(500).json({
            status: 500,
            message: `Error retrieving payment intents: ${error.message}`, // Include Stripe error message
        });
    }
};

exports.refundBooking = async (req, res) => {
    const { paymentIntentId } = req.body; // Expect payment intent ID in the request body

    // Validate input data
    if (!paymentIntentId) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: "Payment Intent ID is required.",
        });
    }

    try {
        // Create a refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId, // Use the payment intent ID
        });

        // Respond with the refund details
        res.status(200).json({
            status: statusCode.OK,
            message: "Refund processed successfully.",
            data: refund,
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: 'Error processing refund.',
            error: error.message,
        });
    }
};
