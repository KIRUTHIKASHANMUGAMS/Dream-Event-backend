const mongoose = require("mongoose");

// Define a schema for role permissions (access control)
const RoleAccessSchema = new mongoose.Schema({
    roleId: { type: String, required: true },
    roleName: { type: String, required: true }, // Store the role name directly for easy access

    rolePermissions: [
        {
            featureId: { type: mongoose.Schema.Types.ObjectId, ref: "Feature", required: true },
            featureName: { type: String, required: true }, // Store the feature name
            permissions: [
                {
                    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true },
                    permissionName: { type: String, required: true } // Store the permission name
                }
            ]
        }
    ],
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RolePermission", RoleAccessSchema);
