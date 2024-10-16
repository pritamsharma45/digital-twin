"use client";

import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");
// const socket = io("https://energy-meter-backend.onrender.com")

export default function EnergyMeter() {
  const [readings, setReadings] = useState({
    meter1: 1000,
    meter2: 1000,
    meter3: 1000,
  });

  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [`meter${meter_id}`]: reading,
    }));
  }, []);

  useEffect(() => {
    socket.on("newReading", updateReading);
    return () => socket.off("newReading", updateReading);
  }, [updateReading]);

  return (
    <div className="container">
      <h1 className="title">Live Energy Meter Readings</h1>
      <div className="meter-grid">
        {Object.entries(readings).map(([meterId, reading]) => (
          <div key={meterId} className="card">
            <div className="card-header">
              <div className="card-title">
                {`Meter ${meterId.slice(-1)}`}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
