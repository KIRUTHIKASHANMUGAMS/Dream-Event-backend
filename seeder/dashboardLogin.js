const Role = require("../model/role-modal");

async function getDashboardLogins() {
    try {
      
        if (!superAdminRole) {
            throw new Error("SuperAdmin role not found");
        }

        return [
            { email: "admin@gmail.com", password: "12345", roleId: superAdminRole._id },
        ];
    } catch (error) {
        console.error("Error fetching dashboard logins:", error.message);
        return [];
    }
}

module.exports.getDashboardLogins = getDashboardLogins;