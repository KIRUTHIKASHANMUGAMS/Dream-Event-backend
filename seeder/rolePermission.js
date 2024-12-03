const RolePermission = require("../model/rolePermission-model"); 
const Role = require("../model/role-modal");
const Permission = require("../model/permission-model");
const Feature = require("../model/appFeatures-model");

async function seedRolePermissions() {
    try {
        // Fetch all required data
        const features = await Feature.find();
        const permissions = await Permission.find();
        const superAdminRole = await Role.findOne({ roleName: "SuperAdmin" });

        if (!superAdminRole) {
            throw new Error("SuperAdmin role not found");
        }

        console.log("SuperAdmin Role:", superAdminRole);
        console.log("Permissions:", permissions);
        console.log("Features:", features);

        // Prepare the data
        const permissionData = permissions.map((permission) => ({
            permissionId: permission._id,
            permissionName: permission.permissionName // Ensure this field exists in your Permission model
        }));

        // Iterate over each feature and create or update a RolePermission entry
        for (const feature of features) {
            const featureData = {
                featureId: feature._id,
                featureName: feature.featureName, // Ensure this field exists in your Feature model
                permissions: permissionData
            };

            // Check if the RolePermission document already exists for this role
            const existingRolePermission = await RolePermission.findOne({ 
                roleId: superAdminRole._id 
            });

            if (existingRolePermission) {
                // Update the existing RolePermission document
                const featureIndex = existingRolePermission.rolePermissions.findIndex(rp => rp.featureId.equals(feature._id));

                if (featureIndex !== -1) {
                    // Update existing feature permissions
                    existingRolePermission.rolePermissions[featureIndex].permissions = permissionData;
                } else {
                    // Add new feature permissions
                    existingRolePermission.rolePermissions.push(featureData);
                }

                existingRolePermission.updatedAt = new Date(); // Update timestamp
                await existingRolePermission.save();
                console.log(`Role permissions updated successfully for feature: ${feature.name}`);
            } else {
                // Create a new RolePermission document if it doesn't exist
                const rolePermissionData = {
                    roleId: superAdminRole._id,
                    roleName: superAdminRole.roleName,
                    rolePermissions: [featureData],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await RolePermission.create(rolePermissionData);
                console.log(`Role permissions seeded successfully for feature: ${feature.name}`);
            }
        }
    } catch (error) {
        console.error("Error seeding role permissions:", error.message);
    }
}

module.exports = { seedRolePermissions };
