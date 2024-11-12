require('dotenv').config();
const express=require("express")
const app=express();
let router=express.Router()

const {connect}=require("./config/database.js")
connect();


const path = require('path');
const bodyParser = require('body-parser'); //--4
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
const cors = require("cors"); //--6
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const {createUser,login,forgotpassword,verifyOtp ,resetPassword}=require('./operation/user-operation.js');
const {favorite , eventCategory}=require("./operation/favoriteEvent-operation.js")
const {chooseEvents}=require("./operation/chooseEvent-operation.js")
const {allowLocationDetail}=require("./operation/allowLocation-operation.js")
const {createUpcomingEvent,eventlist ,eventById ,nearByEvent ,eventListMobile}=require("./operation/upcomingEvent-operation.js");
const {createSeatBooking ,getUserBookings ,getBookingDetails ,paymentDetails , customerList ,ticketBookingStatus}=require("./operation/seatBooking-operation.js");
const {dashboard ,totalEvents , salesRevenue , upcomingEventList}=require("./operation/dashboard-operation.js")
const verifyToken=require('./middleware/authMiddleware.js')
const {getStripePayment , stripePayment ,refundBooking}= require("./operation/stripePaymentgateway-operation.js");
const upload=require ('./utlis/uploadImage.js');
const {dashboardLogin}=require('./operation/dashboardLogin-operation.js')

router.post("/register",createUser);
router.post("/login",login);
router.post("/forgotpassword",forgotpassword);
router.post("/verify-otp",verifyOtp);
router.post("/reset-password",resetPassword);
router.get("/event-category",eventCategory);
router.post("/favorite-event",favorite);
router.post("/choose-event",chooseEvents);
router.post("/allow-location",allowLocationDetail);
router.post("/upcoming-event",upload.any(),  createUpcomingEvent);
router.post("/event-list",eventlist);
router.get("/event-list-view",eventListMobile);

router.get("/eventById",eventById);
router.post("/nearByEvent-list",nearByEvent);
router.post("/seatBooking",createSeatBooking);
router.get("/payment-success", paymentDetails);

router.post("/getBooking-user",getUserBookings);
router.post("/create-checkout-session",getStripePayment);
router.post("/booking-list",getBookingDetails);
router.post("/customer-list",customerList);
router.post("/stripe-payment",stripePayment);
router.post("/stripe-refund",refundBooking);
router.get("/dashboard",dashboard);
router.post("/total-events",totalEvents);
router.post("/sales-events",salesRevenue);
router.post("/upcoming-list",upcomingEventList);
router.post("/dashboard-login",dashboardLogin);
router.post("/ticketbooking-status",ticketBookingStatus);
router.get('/payment-success', (req, res) => {
    res.redirect('myapp://payment-success?redirect=true');
});















router.get("/protected", verifyToken, (req, res) => {
    res.json({ message: "You have accessed a protected route!", userId: req.userId });
});





app.use("/", router);

app.listen(8000,function(){
    console.log("server running successfully");
})