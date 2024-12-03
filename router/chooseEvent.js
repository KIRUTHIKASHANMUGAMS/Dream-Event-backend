const express = require("express");
const router = express.Router();
const {chooseEvents}=require("../operation/chooseEvent-operation.js")



router.post("/choose-event",chooseEvents);
module.exports = router;