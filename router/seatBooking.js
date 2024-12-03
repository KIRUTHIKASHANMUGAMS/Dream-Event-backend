const express = require("express");
const router = express.Router();
const {createSeatBooking ,getUserBookings ,getBookingDetails ,paymentDetails , customerList ,cancelAndRefundBooking,ticketBookingStatus,getSeatBookingStatus ,transactionList }=require("../operation/seatBooking-operation.js");
const authenticate = require('../middleware/authMiddleware.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");


router.post("/seatBooking",createSeatBooking);
router.post("/getBooking-user",getUserBookings);
router.post("/booking-list", authenticate,roleMiddleware(["Bookings",["View"]]),getBookingDetails);
router.post("/cancelRefund", cancelAndRefundBooking);
router.get("/eventStatus",authenticate,roleMiddleware(["Analytics",["View"]]), getSeatBookingStatus);
router.post("/transaction",authenticate,roleMiddleware(["Transaction",["View"],"Dashboard",["View"]]), transactionList);

router.get("/payment-success", paymentDetails);
router.post("/customer-list",authenticate,roleMiddleware(["Customer",["View"]]), customerList);
router.post("/ticketbooking-status",ticketBookingStatus);

module.exports = router;




