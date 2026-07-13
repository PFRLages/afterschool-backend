// CST3144 CW1 - After School Classes App - Back-End Server
// Node.js + Express.js + MongoDB native driver

const express = require("express");
const path = require("path");
const cors = require("cors");
const propertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.set("json spaces", 3); // pretty-print JSON responses

// ---------------------------------------------------------
// MIDDLEWARE A: logger - outputs every request to the console
// ---------------------------------------------------------
app.use(function (req, res, next) {
   console.log("Request URL: " + req.url);
   console.log("Request method: " + req.method);
   console.log("Request date: " + new Date());
   next(); // pass control to the next middleware/route
});

app.use(cors());         // allow the GitHub Pages front-end to call this API
app.use(express.json()); // parse JSON request bodies (needed for POST/PUT later)

// ---------------------------------------------------------
// MIDDLEWARE B: static files for lesson images
// returns the image, or an error message if it does not exist
// ---------------------------------------------------------
const imagePath = path.resolve(__dirname, "images");
app.use("/images", express.static(imagePath));
// this runs only if express.static did NOT find the file:
app.use("/images", function (req, res) {
   res.status(404).send("Image file not found!");
});

// ---------------------------------------------------------
// MongoDB Atlas connection (native Node.js driver only)
// ---------------------------------------------------------
const propertiesPath = path.resolve(__dirname, "conf/db.properties");
const properties = propertiesReader(propertiesPath);
const dbPrefix = properties.get("db.prefix");
const dbUsername = encodeURIComponent(properties.get("db.user"));
// URL-encoding of user and password for potential special characters.
// On AWS the password can come from an environment variable instead of the file:
const dbPwd = encodeURIComponent(process.env.DB_PWD || properties.get("db.pwd"));
const dbName = properties.get("db.dbName");
const dbUrl = properties.get("db.dbUrl");
const dbParams = properties.get("db.params");
const uri = dbPrefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const db = client.db(dbName); // shared by all routes

// ---------------------------------------------------------
// REST API
// ---------------------------------------------------------
// GET /lessons - returns all the lessons as JSON
app.get("/lessons", function (req, res, next) {
   db.collection("lesson").find({}).toArray(function (err, results) {
      if (err) return next(err);
      res.send(results);
   });
});

// (Step 3 will add: POST /orders, PUT /lessons/:id, GET /search)

// error-handling middleware (always last in the stack)
app.use(function (err, req, res, next) {
   console.error(err);
   res.status(500).send("Server error");
});

// ---------------------------------------------------------
// Start the server (process.env.PORT is required for AWS)
// ---------------------------------------------------------
const port = process.env.PORT || 3000;
app.listen(port, function () {
   console.log("App started on port: " + port);
});
