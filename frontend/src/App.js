"use client";

import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://energy-meter-backend.onrender.com" // Production URL
    : "http://localhost:3001" // Development URL
);
export default function EnergyMeter() {
  const [readings, setReadings] = useState({}); // Start with an empty state
  const [loading, setLoading] = useState(true); // Loading state to track when readings are received

  // Update readings with dynamic meter_id
  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [meter_id]: reading, // Add/update new meter reading
    }));
    setLoading(false); // Stop loading when readings start coming in
  }, []);

  useEffect(() => {
    // Listen for new readings
    socket.on("newReading", updateReading);

    // Cleanup when component unmounts
    return () => socket.off("newReading", updateReading);
  }, [updateReading]);

  return (
    <div className="container">
      <h1 className="title">Digital Twin - Live Energy Meter Readings</h1>

      {loading ? ( // Show loading state if no readings are received yet
        <div className="loading">Loading meter readings...</div>
      ) : (
        <div className="meter-grid">
          {Object.entries(readings).map(([meterId, reading]) => (
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
                <div className="reading-display">
                  <span>{reading.toFixed(2)}</span>
                  <span className="unit">kWh</span>
                </div>
                <div className="reading-display">
                  <span className="unit">Supplier:</span>
                </div>
                <div className="reading-display">
                  <span className="unit">Tariff:</span>
                </div>
                <div className="reading-display">
                  <span className="unit">Cost kWh:</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
