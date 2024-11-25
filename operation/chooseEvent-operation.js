const { chooseEvent } = require("../model/chooseEvent-model");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");

exports.chooseEvents = async (req, res) => {
    const { userId, events } = req.body;
    console.log(req.body)

    if (!userId || !events) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: constant.ERR_FIRST_NAME,
        });
    }

    try {
        let userEvent = await chooseEvent.findOne({ userId });

        if (userEvent) {

            await chooseEvent.updateOne(
                { userId },
                { $set: { events } }
            );

            console.log("User events updated:", events);

            return res.status(200).json({
                status: statusCode.OK,
                message: constant.DATA_CREATED
            });
        } else {
            userEvent = new chooseEvent({
                userId,
                events
            });
            await userEvent.save();
            return res.status(201).json({
                status: statusCode.OK,
                message: constant.DATA_CREATED
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }
};
