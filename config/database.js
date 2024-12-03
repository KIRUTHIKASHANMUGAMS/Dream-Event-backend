const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const { favoriteEvents } = require("../seeder/favoriteEvent");
const favoriteEvent = require("../model/favoriteEvent-model");

const DashboardLogin = require("../model/dashboardLogin-model");
const { getDashboardLogins } = require("../seeder/dashboardLogin");
const { seedRolePermissions } = require("../seeder/rolePermission");

const Role = require("../model/role-modal");
const { role } = require("../seeder/role");

const Permission = require("../model/permission-model");
const { permission } = require("../seeder/permission");

const AppFeatures = require("../model/appFeatures-model");
const { feature } = require("../seeder/appFeatures");

const RolePermission = require("../model/rolePermission-model");

const mongo_uri = "mongodb://127.0.0.1:27017/dreamEvent";

const seedDatabase = async () => {
    try {
        const favoriteEventCount = await favoriteEvent.countDocuments({});
        const loginCount = await DashboardLogin.countDocuments({});
        const roleCount = await Role.countDocuments({});
        const permissionCount = await Permission.countDocuments({});
        const appFeatureCount = await AppFeatures.countDocuments({});
        const rolePermissionCount = await RolePermission.countDocuments({});

        if (favoriteEventCount === 0) {
            await favoriteEvent.insertMany(favoriteEvents);
            console.log("Favorite events seeded successfully");
        } else {
            console.log("Favorite events already exist, seeding skipped");
        }

        if (loginCount === 0) {
            const dashboardLogins = await getDashboardLogins();
            if (dashboardLogins.length) {
                await DashboardLogin.insertMany(dashboardLogins);
                console.log("Dashboard logins seeded successfully");
            } else {
                console.log("No dashboard logins to seed");
            }
        } else {
            console.log("Dashboard logins already exist, seeding skipped");
        }

        if (roleCount === 0) {
            await Role.insertMany(role);
            console.log("Roles seeded successfully");
        } else {
            console.log("Roles already exist, seeding skipped");
        }

        if (permissionCount === 0) {
            await Permission.insertMany(permission);
            console.log("Permissions seeded successfully");
        } else {
            console.log("Permissions already exist, seeding skipped");
        }

        if (appFeatureCount === 0) {
            await AppFeatures.insertMany(feature);
            console.log("App Features seeded successfully");
        } else {
            console.log("App Features already exist, seeding skipped");
        }

        if (rolePermissionCount === 0) {
            await seedRolePermissions();
            console.log("Role permissions seeded successfully");
        } else {
            console.log("Role permissions already exist, seeding skipped");
        }
    } catch (error) {
        console.error("Seeding failed: " + error.message);
    }
};

exports.connect = async () => {
    try {
        await mongoose.connect(mongo_uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Successfully connected to database");
        await seedDatabase();
        
    } catch (error) {
        console.error("Database connection failed: " + error.message);
    }
};