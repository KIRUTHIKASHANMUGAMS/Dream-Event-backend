const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema({
    email: { type: String, required: true,unique: true  },
    userName: { type: String, },
    password: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    accessToken:{type: String},
    refreshToken:{type: String},

});

module.exports = mongoose.model('DashboardLogin', dashboardSchema);
