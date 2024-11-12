const dashboardLogin = require('../model/dashboardLogin-model');
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");


exports.dashboardLogin=async(req,res)=>{
    try {
        const dashboard = await dashboardLogin.find();

        return res.status(200).json({
            status: statusCode.OK,
            message: constant.LOGIN_SUCCESFULLY,
        });
    } catch (error) {
        console.error('Error retrieving events:', error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_SERVER,
        });
    }

}