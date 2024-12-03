const express = require("express");
const router = express.Router();
const {permission}=require("../operation/permission-operation.js");

router.get("/permission" ,permission);

module.exports = router;