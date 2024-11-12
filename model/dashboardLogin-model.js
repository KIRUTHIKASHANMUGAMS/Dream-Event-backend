const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model('DashboardLogin', dashboardSchema);
