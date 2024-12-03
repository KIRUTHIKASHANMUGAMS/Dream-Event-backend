const express = require("express");
const router = express.Router();
const {allowLocationDetail}=require("../operation/allowLocation-operation")


router.post("/allow-location",allowLocationDetail);

module.exports = router;