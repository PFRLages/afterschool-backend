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

// ---------- REST API routes ----------

// GET /lessons
// Returns all lessons from the database as a JSON array
app.get("/lessons", async function (req, res) {
    try {
        const lessons = await db.collection("lesson").find({}).toArray();
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch lessons" });
    }
});

// POST /orders
// Saves a new order to the database.
// Expected body: { name, phone, lessonIDs: [...], spaces }
app.post("/orders", async function (req, res) {
    try {
        const order = req.body;

        // Basic validation: an order must have a name, phone and at least one lesson
        if (!order.name || !order.phone || !order.lessonIDs || order.lessonIDs.length === 0) {
            return res.status(400).json({ error: "Order must include name, phone and lessonIDs" });
        }

        const result = await db.collection("order").insertOne(order);
        res.status(201).json({ message: "Order created", orderId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Failed to create order" });
    }
});

// PUT /lessons/:id
// Updates any attribute(s) of a lesson identified by its id.
// The request body contains the fields to update, e.g. { "space": 3 }
app.put("/lessons/:id", async function (req, res) {
    try {
        const lessonId = new ObjectId(req.params.id);
        const result = await db.collection("lesson").updateOne(
            { _id: lessonId },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Lesson not found" });
        }
        res.json({ message: "Lesson updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update lesson" });
    }
});

// GET /search?q=term
// Performs a full-text search over the lessons.
// Matches the query against topic, location, price and space (case-insensitive).
app.get("/search", async function (req, res) {
    try {
        // The search term sent by the client, e.g. /search?q=london
        const query = (req.query.q || "").toLowerCase();

        // Fetch all lessons, then keep only those where any field contains the term
        const lessons = await db.collection("lesson").find({}).toArray();
        const results = lessons.filter(function (lesson) {
            return (
                lesson.topic.toLowerCase().includes(query) ||
                lesson.location.toLowerCase().includes(query) ||
                lesson.price.toString().includes(query) ||
                lesson.space.toString().includes(query)
            );
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to search lessons" });
    }
});

// Simple root route to confirm the server is running
app.get("/", function (req, res) {
    res.send("After School API is running. Try GET /lessons");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server running on port " + port);
});