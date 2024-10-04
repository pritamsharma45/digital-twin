const express = require("express");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { env } = require("process");

const app = express();
const server = http.createServer(app);

app.use(cors());

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });
const io = new Server(server, {
  cors: {
    origin: "https://digital-twin-neon.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Supabase Client . Load from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch the last saved reading from Supabase on server start
const fetchLastReading = async () => {
  const { data, error } = await supabase
    .from("readings")
    .select("reading")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching last reading:", error.message);
    return null;
  }
  return data.length > 0 ? data[0].reading : null;
};

// Function to generate new reading
let reading = 1000;
const generateReading = () => {
  reading += Math.random() * 10; // Small random changes to the reading
  return reading.toFixed(2);
};

// Function to save reading to Supabase
const saveReadingToDb = async (reading) => {
  const timestamp = new Date().toISOString(); // Current timestamp
  const { data, error } = await supabase.from("readings").insert([
    {
      timestamp: timestamp,
      reading: reading,
    },
  ]);

  if (error) {
    console.error("Error inserting reading:", error.message);
  } else {
    console.log(`Reading saved: ${reading} at ${timestamp}`);
  }
};

// Start the server
(async () => {
  const lastReading = await fetchLastReading();
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
    }, 10000);

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  server.listen(3001, () => {
    console.log("Server is running on port 3001");
  });
})();
