const express = require("express");
const router = express.Router();
const {favorite , eventCategory}=require("../operation/favoriteEvent-operation.js")


router.get("/event-category", eventCategory);
router.post("/favorite-event",favorite);


module.exports = router;