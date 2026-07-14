// Import required modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const propertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Create the Express application
const app = express();

// Parse incoming JSON request bodies
app.use(express.json());

// Allow cross-origin requests so the frontend (on a different domain) can call this API
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// ---------- Logger middleware ----------
// Logs every incoming request with the time, HTTP method and URL
app.use(function (req, res, next) {
    console.log(new Date().toISOString() + " - " + req.method + " " + req.url);
    next();
});

// ---------- Static file middleware ----------
// Serves lesson images from the static/images folder.
// If the requested image does not exist, an error message is returned.
app.use("/images", function (req, res) {
    const filePath = path.join(__dirname, "static/images", req.url);
    fs.access(filePath, fs.constants.F_OK, function (err) {
        if (err) {
            res.status(404).json({ error: "Image not found" });
        } else {
            res.sendFile(filePath);
        }
    });
});

// ---------- MongoDB Atlas connection ----------
// Read the connection details from the properties file
const properties = propertiesReader(path.join(__dirname, "conf/db.properties"));
const dbUser = properties.get("db.user");
const dbPwd = encodeURIComponent(properties.get("db.pwd"));
const dbName = properties.get("db.dbName");
const dbUrl = properties.get("db.dbUrl");
const dbHost = properties.get("db.dbHost");
const dbParams = properties.get("db.params");

// Build the full connection string
const uri = dbUrl + "://" + dbUser + ":" + dbPwd + "@" + dbHost + "/" + dbParams;

// Create the client and connect to the database
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db;

async function connectDB() {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB database: " + dbName);
}
connectDB().catch(console.error);

// Simple root route to confirm the server is running
app.get("/", function (req, res) {
    res.send("After School API is running. Try GET /lessons");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server running on port " + port);
});