const mongoose = require("mongoose");

const FeatureSchema = new mongoose.Schema({
  featureName: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Feature", FeatureSchema);
