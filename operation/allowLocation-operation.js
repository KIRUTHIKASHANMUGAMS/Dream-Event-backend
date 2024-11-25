const AllowLocation = require("../model/allowLocation-model"); // Ensure this matches your export
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");

exports.allowLocationDetail = async (req, res) => {
    const { userId, lat, long } = req.body;

    if (!userId || lat === undefined || long === undefined) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: constant.ERR_FIRST_NAME,
        });
    }

    try {
        let userEvent = await AllowLocation.findOne({ userId });


        if (userEvent) {

            await AllowLocation.updateOne(
                { userId },
                { $set: { lat, long } }
            );


            return res.status(200).json({
                status: statusCode.OK,
                message: constant.DATA_CREATED
            });
        } else {
            const newLocation = new AllowLocation({
                userId,
                lat: lat,
                long: long,
            });

            // Save the location to the database
            await newLocation.save();

            return res.status(200).json({
                status: statusCode.OK,
                message: constant.LOCATION_SAVED_SUCCESSFULLY,
            });
        }


    } catch (err) {
        console.log(err); // Log the error for debugging
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR,
        });
    }
};
