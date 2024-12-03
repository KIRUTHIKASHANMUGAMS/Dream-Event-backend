const express = require("express");
const router = express.Router();

// Import route files
const allLocation = require("./allowLocation");
const bookMark = require("./bookMark");
const chooseEvent = require("./chooseEvent");
const dashboard = require("./dashboard");
const dashboardLogin = require("./dashboardLogin");
const favoriteEvent = require("./favoriteEvent");
const features = require("./features");
const middleware = require("./middleware");
const permission = require("./permission");
const role = require("./role");
const rolePermission = require("./rolePermission");
const seatBooking = require("./seatBooking");
const upcomingEvent = require("./upcomingEvent");
const user = require("./user");

// Mount routes
router.use("/", allLocation);
router.use("/", bookMark);
router.use("/", chooseEvent);
router.use("/", dashboard);
router.use("/", dashboardLogin);
router.use("/", favoriteEvent);
router.use("/", features);
router.use("/", middleware);
router.use("/", permission);
router.use("/", role);
router.use("/", rolePermission);
router.use("/", seatBooking);
router.use("/", upcomingEvent);
router.use("/", user);

module.exports = router;
