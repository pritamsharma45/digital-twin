"use client";

import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

// Define socket connection based on environment
const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://energy-meter-backend.onrender.com" // Production URL
    : "http://localhost:3001" // Development URL
);

// Predefined data for suppliers, costs, and tariffs
let meterData = {
  "SMR-98756-1-A": {
    supplier: "Octopus Energy",
    cost: 23.28, // Cost per kWh in pence
    tariff: "Fixed", // Tariff type
  },
  "SMR-43563-2-A": {
    supplier: "EDF Energy",
    cost: 23.28, // Cost per kWh in pence
    tariff: "Fixed", // Tariff type
  },
  "SMR-65228-1-B": {
    supplier: "E.ON Next",
    cost: 25.69, // Cost per kWh in pence
    tariff: "Standard", // Tariff type
  },
};

export default function EnergyMeter() {
  const [readings, setReadings] = useState({}); // Start with an empty state
  const [loading, setLoading] = useState(true); // Loading state to track when readings are received

  // Update readings with dynamic meter_id and reading data
  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [meter_id]: {
        ...meterData[meter_id], // Merge meter info (supplier, cost, tariff)
        reading: reading.toFixed(2), // Store the reading rounded to 2 decimals
      },
    }));
    setLoading(false); // Stop loading when readings start coming in
  }, []);

  useEffect(() => {
    // Listen for new readings from the socket
    socket.on("newReading", updateReading);

    // Cleanup on component unmount
    return () => socket.off("newReading", updateReading);
  }, [updateReading]);

  return (
    <div className="container">
      <h1 className="title">Digital Twin - Live Energy Meter Readings</h1>

      {loading ? ( // Show loading state if no readings are received yet
        <div className="loading">Loading meter readings...</div>
      ) : (
        <div className="meter-grid">
          {Object.entries(readings).map(([meterId, data]) => (
            <div key={meterId} className="card">
              <div className="card-header">
                <div className="card-title">
                  {`Meter ${meterId}`} {/* Display the full meter ID */}
                  <span className="status-indicator">
                    <span className="ping"></span>
                    <span className="dot"></span>
                  </span>
                </div>
              </div>
              <div className="card-content">
                {/* Display the current energy reading */}
                <div className="reading-display">
                  <span>{data.reading}</span>
                  <span className="unit">kWh</span>
                </div>

                {/* Display supplier */}
                <div className="other-display">
                  <span className="unit2">Supplier:</span>
                  <span>{data.supplier}</span>
                </div>

                {/* Display tariff */}
                <div className="other-display">
                  <span className="unit2">Tariff:</span>
                  <span>{data.tariff}</span>
                </div>

                {/* Display cost per kWh */}
                <div className="other-display">
                  <span className="unit2">Cost per kWh:</span>
                  <span>{data.cost}p</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
