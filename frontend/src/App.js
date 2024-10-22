"use client";

import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

// const socket = io("http://localhost:3001");
const socket = io("https://energy-meter-backend.onrender.com");

export default function EnergyMeter() {
  const [readings, setReadings] = useState({}); // Start with an empty state

  // Update readings with dynamic meter_id
  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [meter_id]: reading, // Add/update new meter reading
    }));
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
    </div>
  );
}
