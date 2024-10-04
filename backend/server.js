const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Setup SQLite Database
const db = new sqlite3.Database("./energy_readings.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    db.run(
      `CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        reading REAL
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        }
      }
    );
  }
});

// Initialize the reading variable
let reading = 1000;

// Fetch the last saved reading from the database on server start
const fetchLastReading = () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT reading FROM readings ORDER BY id DESC LIMIT 1`,
      [],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.reading : null);
        }
      }
    );
  });
};

// Function to generate new reading
const generateReading = () => {
  reading += Math.random() * 10; // Small random changes to the reading
  return reading.toFixed(2);
};

// Function to save reading to the database
const saveReadingToDb = (reading) => {
  const timestamp = new Date().toISOString(); // Current timestamp
  db.run(
    `INSERT INTO readings (timestamp, reading) VALUES (?, ?)`,
    [timestamp, reading],
    (err) => {
      if (err) {
        console.error("Error inserting reading:", err.message);
      } else {
        console.log(`Reading saved: ${reading} at ${timestamp}`);
      }
    }
  );
};

// Start the server
fetchLastReading()
  .then((lastReading) => {
    if (lastReading) {
      reading = parseFloat(lastReading); // Start from the last saved reading
      console.log(`Starting with last saved reading: ${reading}`);
    } else {
      console.log(
        `No previous readings found. Starting from default: ${reading}`
      );
    }

    // WebSocket connection
    io.on("connection", (socket) => {
      console.log("A user connected");

      setInterval(() => {
        const newReading = generateReading();
        socket.emit("newReading", newReading);
        saveReadingToDb(newReading);
      }, 2000);

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    server.listen(3001, () => {
      console.log("Server is running on port 3001");
    });
  })
  .catch((err) => {
    console.error("Error fetching last reading:", err.message);
  });
