const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

module.exports = mongoose.model('FavoriteEvent', favoriteSchema);
