const permissionModal = require("../model/permission-model");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");


exports.permission=async(req,res)=>{
    try {
        const events = await permissionModal.find();

        return res.status(200).json({
            status: statusCode.OK,
            data: events,
        });
    } catch (error) {
        console.error('Error retrieving events:', error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_SERVER,
        });
    }

}