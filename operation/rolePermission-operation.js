const RolePermission = require('../model/rolePermission-model');
const Role = require("../model/role-modal");
const Permission = require("../model/permission-model");
const Feature = require("../model/appFeatures-model");
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");

exports.rolePermission = async (req, res) => {
    const { roleId, featurePermissions } = req.body;

    if (!roleId || !Array.isArray(featurePermissions) || featurePermissions.length === 0) {
        return res.status(400).json({ message: "Missing required fields or invalid feature permissions." });
    }

    try {
        // Check if the role exists
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ message: "Role not found." });

        // Check if permissions already assigned
        const existingRole = await RolePermission.findOne({ roleId, isDeleted: false  });
        if (existingRole) {
            return res.status(400).json({ message: `Role with ID ${roleId} already has feature permissions assigned.` });
        }

        // Prepare rolePermissions data
        const rolePermissionsData = [];

        for (const feature of featurePermissions) {
            const featureData = await Feature.findById(feature.featureId);
            if (!featureData) {
                return res.status(404).json({ message: `Feature with ID ${feature.featureId} not found.` });
            }

            const permissionsData = [];
            for (const permId of feature.permissions) {
                const permission = await Permission.findById(permId);
                if (!permission) {
                    return res.status(404).json({ message: `Permission with ID ${permId} not found.` });
                }

                permissionsData.push({
                    permissionId: permission._id,
                    permissionName: permission.permissionName,
                });
            }

            rolePermissionsData.push({
                featureId: feature.featureId,
                featureName: featureData.featureName,
                permissions: permissionsData,
            });
        }

        // Save role permissions
        const rolePermission = new RolePermission({
            roleId,
            roleName: role.roleName,
            rolePermissions: rolePermissionsData,
        });
        await rolePermission.save();

        return res.status(200).json({
            status: 200,
            message: "Role permissions assigned successfully.",
         
        });
    } catch (error) {
        console.error("Error managing role permissions:", error);
        return res.status(500).json({
            message: "An internal server error occurred.",
            error: error.message,
        });
    }
};


exports.editRoleAndPermission = async (req, res) => {
    const { roleId, featurePermissions } = req.body;

    console.log("rehu" ,req.body)
    // Validate request
    if (!roleId || !Array.isArray(featurePermissions) || featurePermissions.length === 0) {
        return res.status(400).json({ message: "Missing required fields or invalid feature permissions." });
    }

    try {
        // Check if the role exists
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ message: "Role not found." });

        // Check if role permissions already exist
        const existingRole = await RolePermission.findOne({ roleId });
        if (!existingRole) {
            return res.status(404).json({ message: "Role permissions not found to edit." });
        }

        // Prepare updated rolePermissions data
        const updatedRolePermissions = [];

        for (const feature of featurePermissions) {
            const featureData = await Feature.findById(feature.featureId);
            if (!featureData) {
                return res.status(404).json({ message: `Feature with ID ${feature.featureId} not found.` });
            }

            const permissionsData = [];
            for (const permId of feature.permissions) {
                const permission = await Permission.findById(permId);
                if (!permission) {
                    return res.status(404).json({ message: `Permission with ID ${permId} not found.` });
                }

                permissionsData.push({
                    permissionId: permission._id,
                    permissionName: permission.permissionName,
                });
            }

            updatedRolePermissions.push({
                featureId: feature.featureId,
                featureName: featureData.featureName,
                permissions: permissionsData,
            });
        }

        // Update role permissions in the database
        existingRole.rolePermissions = updatedRolePermissions;
        existingRole.updatedAt = Date.now();
        await existingRole.save();

        return res.status(200).json({
            status: 200,
            message: "Role permissions updated successfully.",
            data: existingRole,
        });
    } catch (error) {
        console.error("Error editing role permissions:", error);
        return res.status(500).json({
            message: "An internal server error occurred.",
            error: error.message,
        });
    }
};




exports.rolePermissionList = async (req, res) => {
    try {
        const rolePermissions = await RolePermission.find({ isDeleted: false })

        // Send a success response with the formatted data
        return res.status(200).json({
            status: 200,
            data: rolePermissions,
        });
    } catch (error) {
        console.error('Error retrieving role permissions:', error);
        // Send an error response if something goes wrong
        return res.status(500).json({
            status: 500,
            message: 'An error occurred while retrieving role permissions.',
            error: error.message,
        });
    }
};

exports.rolePermissionListById = async (req, res) => {
    try {
        const { id } = req.params;  // Extract the ID from the URL parameters

        // Find the role permission by ID
        const role = await RolePermission.findOne({ _id: id});

        // Check if the role exists
        if (!role) {
            return res.status(404).json({ message: "Role permission not found" });
        }

        // Return the found role permission
        res.status(200).json(role);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while fetching the role permission" });
    }
};

//delete
exports.rolePermissionDelete = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Role ID is required." });
    }

    try {
        // Check if the role exists
        const role = await RolePermission.findById(id);
        if (!role) return res.status(404).json({ message: "Role not found." });

        // Mark the role as deleted
        role.isDeleted = true;
        await role.save();

        return res.status(200).json({
            status: 200,
            message: "Role soft deleted successfully.",
            data: role,
        });
    } catch (error) {
        console.error("Error soft deleting role:", error);
        return res.status(500).json({
            message: "An internal server error occurred.",
            error: error.message,
        });
    }
};
