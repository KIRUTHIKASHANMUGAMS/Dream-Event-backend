require('dotenv').config();
const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require("cors");

// Import database connection
const { connect } = require("./config/database.js");
connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import and use routers
const routes = require("./router/index.js");
app.use("/", routes); // Mount all routes from `router/index.js`

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, function () {
    console.log(`Server running successfully on port ${PORT}`);
});
