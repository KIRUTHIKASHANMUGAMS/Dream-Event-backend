const express = require("express");
const router = express.Router();
const {createUpcomingEvent,eventlist ,eventById ,nearByEvent ,eventListMobile ,editUpcomingEvent ,getEventById,deleteUpcomingEvent}=require("../operation/upcomingEvent-operation.js");
const authenticate = require('../middleware/authMiddleware.js');
const upload=require ('../utlis/uploadImage.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");

router.post("/upcoming-event",authenticate ,upload.any(),roleMiddleware(["Event" , ["Create"]]),  createUpcomingEvent);
router.post("/event-list", authenticate,roleMiddleware(["Event",["View"]]), eventlist);
router.get("/event-list-view",eventListMobile);
router.put('/upcoming-event/:id',authenticate ,upload.any(),roleMiddleware(["Event" , ["Create"]]), editUpcomingEvent); // Update event
router.get('/upcoming-event/:id',authenticate,roleMiddleware(["Event",["View"]]), getEventById); // Get event by ID
router.delete('/upcoming-event/:id',authenticate ,upload.any(),roleMiddleware(["Event" , ["Create"]]), deleteUpcomingEvent); 
router.get("/eventById", eventById);
router.post("/nearByEvent-list",nearByEvent);


module.exports = router;