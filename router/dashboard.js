const express = require("express");
const router = express.Router();
const { dashboard, totalEvents, salesRevenue, upcomingEventList } = require("../operation/dashboard-operation.js");
const authenticate = require('../middleware/authMiddleware.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");

router.get("/dashboard",authenticate, roleMiddleware(["Dashboard" ,["View"]]), dashboard);
router.post("/total-events", authenticate, roleMiddleware(["Dashboard",["View"]]), totalEvents);
router.post("/sales-events", authenticate, roleMiddleware(["Dashboard",["View"]]), salesRevenue);
router.post("/upcoming-list", authenticate, roleMiddleware(["Dashboard",["View"]]), upcomingEventList);

//Mobile


router.get("/dashboard-list", dashboard);

module.exports = router;
