const express = require("express");
const router = express.Router();
const {createUser,login,forgotpassword,verifyOtp ,resetPassword}=require('../operation/user-operation.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");


router.post("/register",roleMiddleware(["User_Management", ["Create"]]), createUser);
router.post("/login",login);
router.post("/forgotpassword",forgotpassword);
router.post("/verify-otp",verifyOtp);
router.post("/reset-password",resetPassword);

module.exports = router;