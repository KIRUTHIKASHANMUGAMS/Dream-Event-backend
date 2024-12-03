const express = require("express");
const router = express.Router();
const {features}=require("../operation/features-operation.js");
const roleMiddleware = require("../middleware/roleMiddleware.js");
const authenticate = require('../middleware/authMiddleware.js');

router.get("/feature" ,authenticate,roleMiddleware(["Role Management" ,["View"]]),features);


module.exports = router;