const roleModal = require("../model/role-modal");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");




exports.createRole = async (req, res) => {
    try {
        const { roleName } = req.body; // Assuming the role name is sent in the request body

        // Validate input
        if (!roleName) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: "Role name is required.",
            });
        }
        console.log("roleName" ,roleName) 

        // Create a new role
        const newRole = new roleModal({ roleName: roleName });

        await newRole.save();

        return res.status(201).json({
            status: statusCode.CREATED,
            data: newRole,
            message: "Role created successfully.",
        });
    } catch (error) {
        console.error('Error creating role:', error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_SERVER,
        });
    }
};

exports.role=async(req,res)=>{
    try {
        const events = await roleModal.find();

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
