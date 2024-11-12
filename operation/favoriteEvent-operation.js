const favoriteEvent = require('../model/favoriteEvent-model');
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");

exports.favorite = async (req, res) => {
    const { name } = req.body
    if (!name) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: constant.ERR_FIRST_NAME,
        });
    }

    await favoriteEvent.save();


    return res.status(200).json({
        status: statusCode.OK,
        message: constant.DATA_CREATED
    });


}

exports.eventCategory = async (req, res) => {
    try {
        const events = await favoriteEvent.find();

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
};