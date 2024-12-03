const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the UserRole Schema
const userRoleSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a 'User' model that stores user details
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role', // Assuming you have a 'Role' model for roles like 'Admin', 'User', etc.
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // This will automatically add `createdAt` and `updatedAt`
);

// Create and export the UserRole model
const UserRole = mongoose.model('UserRole', userRoleSchema);
module.exports = UserRole;
