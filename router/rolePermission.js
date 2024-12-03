
const express = require("express");
const router = express.Router();
const {rolePermission ,rolePermissionList, editRoleAndPermission ,rolePermissionListById ,rolePermissionDelete}=require('../operation/rolePermission-operation.js');
const authenticate = require('../middleware/authMiddleware.js');
const roleMiddleware = require("../middleware/roleMiddleware.js");

router.post("/role-permission",authenticate ,roleMiddleware(["Role Management" ,["Create"]]),rolePermission);
router.get("/role-permission", authenticate,roleMiddleware(["Role Management" ,["View"]]),rolePermissionList);
router.put('/role-permission',authenticate ,roleMiddleware(["Role Management" ,["Create"]]), editRoleAndPermission); 
router.delete('/role-permission/:id',authenticate ,roleMiddleware(["Role Management" ,["Delete"]]), rolePermissionDelete); 

router.get('/role-permission/:id',authenticate,roleMiddleware(["Role Management" ,["View"]]) ,rolePermissionListById);  
module.exports = router;