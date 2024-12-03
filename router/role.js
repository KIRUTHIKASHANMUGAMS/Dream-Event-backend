const express = require("express");
const router = express.Router();
const {role ,createRole}=require('../operation/role-operation.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");
const authenticate = require('../middleware/authMiddleware.js');

router.get("/role", authenticate,roleMiddleware(["Role Management" ,["View"]]),role);
router.post("/role", authenticate,roleMiddleware(["Role Management" ,["Create"]]),createRole);


module.exports = router;