const mongoose = require("mongoose");

const permissionLevelSchema = new mongoose.Schema({
  permissionName: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Permission", permissionLevelSchema);
