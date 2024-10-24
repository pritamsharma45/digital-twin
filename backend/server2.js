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
const ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://digital-twin-neon.vercel.app"
    : "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Supabase Client . Load from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the provided meter IDs
let readings = {
  "SMR-98756-1-A": 1000,
  "SMR-43563-2-A": 2000,
  "SMR-65228-1-B": 3000,
};

// Fetch the last saved reading for each meter from Supabase on server start
const fetchLastReading = async (meter_id) => {
  const { data, error } = await supabase
    .from("readings")
    .select("reading")
    .eq("meter_id", meter_id)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error(
      `Error fetching last reading for meter ${meter_id}:`,
      error.message
    );
    return null;
  }
  return data.length > 0 ? data[0].reading : null;
};

// Function to generate new reading
const generateReading = (meter_id) => {
  readings[meter_id] += Math.random() * 10; // Small random changes to the reading
  return readings[meter_id];
};

// Function to save reading to Supabase
const saveReadingToDb = async (meter_id, reading) => {
  const timestamp = new Date().toISOString(); // Current timestamp
  const { data, error } = await supabase.from("readings").insert([
    {
      timestamp: timestamp,
      meter_id: meter_id, // Save meter_id
      reading: reading,
    },
  ]);

  if (error) {
    console.error(
      `Error inserting reading for meter ${meter_id}:`,
      error.message
    );
  } else {
    console.log(
      `Reading for meter ${meter_id} saved: ${reading} at ${timestamp}`
    );
  }
};

// Start the server
(async () => {
  // Initialize readings for each predefined meter
  for (const meter_id of Object.keys(readings)) {
    const lastReading = await fetchLastReading(meter_id);
    if (lastReading) {
      readings[meter_id] = parseFloat(lastReading); // Start from the last saved reading
      console.log(
        `Starting with last saved reading for meter ${meter_id}: ${readings[meter_id]}`
      );
    } else {
      console.log(
        `No previous readings found for meter ${meter_id}. Starting from default: ${readings[meter_id]}`
      );
    }
  }

  // WebSocket connection
  io.on("connection", (socket) => {
    console.log("A user connected");

    setInterval(() => {
      // Iterate over predefined meter IDs
      for (const meter_id of Object.keys(readings)) {
        const newReading = generateReading(meter_id);
        socket.emit("newReading", { meter_id, reading: newReading }); // Send reading with meter_id
        saveReadingToDb(meter_id, newReading); // Save to DB with meter_id
      }
    }, 15000);

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  server.listen(3001, () => {
    console.log("Server is running on port 3001");
  });
})();
