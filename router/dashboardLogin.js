const express = require("express");
const router = express.Router();
const {dashboardLogin ,refreshAccessToken ,createDashboardUser}=require('../operation/dashboardLogin-operation.js')


router.post("/create-user" , createDashboardUser)
router.post("/dashboard-login",dashboardLogin);
router.post('/refresh-token', refreshAccessToken)

module.exports = router;