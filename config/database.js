const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const { favoriteEvents } = require("../seeder/favoriteEvent");
const  favoriteEvent  = require("../model/favoriteEvent-model");
const  DashboardLogin  = require("../model/dashboardLogin-model");
const { dashboardLogins } = require("../seeder/dashboardLogin");

const mongo_uri = "mongodb://127.0.0.1:27017/dreamEvent";

const seedDatabase = async () => {
    try {
        const favoriteEventCount = await favoriteEvent.countDocuments({});
        const loginCount = await DashboardLogin.countDocuments({});

        if (favoriteEventCount === 0) {
            await favoriteEvent.insertMany(favoriteEvents);
            console.log("Favorite events seeded successfully");
        } else {
            console.log("Favorite events already exist, seeding skipped");
        }

        if (loginCount === 0) {
            await DashboardLogin.insertMany(dashboardLogins);
            console.log("Dashboard logins seeded successfully");
        } else {
            console.log("Dashboard logins already exist, seeding skipped");
        }
    } catch (error) {
        console.error("Seeding failed: " + error.message);
    }
};

exports.connect = async () => {
    try {
        await mongoose.connect(mongo_uri);
        console.log("Successfully connected to database");
        await seedDatabase();
    } catch (error) {
        console.error("Database connection failed: " + error.message);
    }
};
