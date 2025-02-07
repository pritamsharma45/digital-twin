"use client";

import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define socket connection based on environment
const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://energy-meter-backend.onrender.com" // Production URL
    : "http://localhost:3001" // Development URL
);

// Predefined data for suppliers, costs, and tariffs
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwCj9rnnCzWeQqH2uJQJg8A5z7Kn8zBulo-UwxzRDCljB2ox6usvTOcWVw93TlYWbVo/exec";

let meterData = {
  "SMR-98756-1-A": {
    supplier: "Octopus Energy",
    cost: 23.28, // Cost per kWh in pence
    tariff: "Fixed", // Tariff type
    total: 0,
  },
  "SMR-43563-2-A": {
    supplier: "EDF Energy",
    cost: 23.28, // Cost per kWh in pence
    tariff: "Fixed", // Tariff type
    total: 0,
  },
  "SMR-65228-1-B": {
    supplier: "E.ON Next",
    cost: 25.69, // Cost per kWh in pence
    tariff: "Standard", // Tariff type
    total: 0,
  },
};

export default function EnergyMeter() {
  const [readings, setReadings] = useState({}); // Start with an empty state
  const [loading, setLoading] = useState(true); // Loading state to track when readings are received
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();
  const [isSending, setIsSending] = useState(false);

  // Update readings with dynamic meter_id and reading data
  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [meter_id]: {
        ...meterData[meter_id], // Merge meter info (supplier, cost, tariff)
        reading: reading.toFixed(2), // Store the reading rounded to 2 decimals
        total: ((reading * meterData[meter_id].cost) / 100).toFixed(2), // Calculate total cost
      },
    }));
    setLoading(false); // Stop loading when readings start coming in
  }, []);

  useEffect(() => {
    socket.on("newReading", updateReading);
    return () => socket.off("newReading", updateReading);
  }, [updateReading]);

  const stopReading = () => {
    socket.emit("stopReading");
    setIsReadingActive(false);
  };

  const startReading = () => {
    socket.emit("startReading");
    setIsReadingActive(true);
  };
  const handleMeterSelect = (meterId, data) => {
    setSelectedMeter({ id: meterId, ...data });
    setShowModal(true);
  };

  const handleSendReading = async () => {
    if (selectedMeter && user) {
      setIsSending(true);
      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            userEmail: user.primaryEmailAddress.emailAddress,
            meterData: {
              id: selectedMeter.id,
              reading: selectedMeter.reading,
              supplier: selectedMeter.supplier,
              tariff: selectedMeter.tariff,
              cost: selectedMeter.cost,
              total: selectedMeter.total,
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Meter reading details sent to your email!");
          setShowModal(false);
        } else {
          throw new Error(data.error || "Failed to send email");
        }
      } catch (error) {
        console.error("Email error:", error);
        toast.error("Failed to send email: " + error.message);
      } finally {
        setIsSending(false);
      }
    }
  };

  const MeterDetailModal = () => {
    if (!selectedMeter || !showModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Meter Details - {selectedMeter.id}</h2>
            <button
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="detail-row">
              <h3>Current Reading</h3>
              <p>{selectedMeter.reading} kWh</p>
            </div>
            <div className="detail-row">
              <h3>Supplier Information</h3>
              <p>Supplier: {selectedMeter.supplier}</p>
              <p>Tariff Type: {selectedMeter.tariff}</p>
            </div>
            <div className="detail-row">
              <h3>Cost Calculation</h3>
              <p>Rate per kWh: {selectedMeter.cost}p</p>
              <p>Total Cost: £{selectedMeter.total}</p>
            </div>
            <div className="detail-row">
              <button
                className="send-reading-button"
                onClick={handleSendReading}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Meter Reading"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MeterGrid = ({ isInteractive = true }) => (
    <div className="meter-grid">
      {Object.entries(readings).map(([meterId, data]) => (
        <div
          key={meterId}
          className={`card ${
            isInteractive ? "card-interactive" : "card-disabled"
          }`}
          onClick={
            isInteractive ? () => handleMeterSelect(meterId, data) : undefined
          }
          role={isInteractive ? "button" : undefined}
          tabIndex={isInteractive ? 0 : undefined}
        >
          <div className="card-header">
            <div className="card-title">
              {`Meter ${meterId}`}
              <span className="status-indicator">
                <span
                  className={`ping ${isReadingActive ? "active" : "stopped"}`}
                ></span>
                <span
                  className={`dot ${isReadingActive ? "active" : "stopped"}`}
                ></span>
              </span>
            </div>
          </div>
          <div className="card-content">
            <div className="reading-display">
              <span>{data.reading}</span>
              <span className="unit">kWh</span>
            </div>
            <div className="other-display">
              <span className="unit2">Supplier:</span>
              <span>{data.supplier}</span>
            </div>
            <div className="other-display">
              <span className="unit2">Tariff:</span>
              <span>{data.tariff}</span>
            </div>
            <div className="other-display">
              <span className="unit2">Cost per kWh:</span>
              <span>{data.cost}p</span>
            </div>
            <div className="other-display">
              <span className="unit2">Total Cost:</span>
              <span>£{data.total}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* New Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>DSS Energy Meter</h2>
        </div>
        <div className="navbar-auth">
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      <div className="container">
        <h1 className="title">Price Comparison Smart Energy Meter Reader</h1>
        <p>
          The DSS <strong>Digital Twin Smart Energy Meter Reader</strong>, helps
          you find the best electricity meter at the most competitive price.
          Compare diferent meters, check prices and choose the right option to
          save on energy bills.
        </p>
        <SignedOut>
          <p>
            Start comparing now and make smarter choices for your electricity
            usage. Please
            <SignInButton mode="modal" className="login-button">
              Sign in
            </SignInButton>
            and select a Smart Meter!
          </p>
        </SignedOut>
        <SignedIn>
          <p>
            Start comparing now and make smarter choices for your electricity
            usage. Please select a Smart Meter!
          </p>
        </SignedIn>

        {loading ? (
          <div className="loading">Loading meter readings...</div>
        ) : (
          <div className="meter-container">
            <SignedOut>
              <SignInButton mode="modal">
                <MeterGrid isInteractive={false} />
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <MeterGrid isInteractive={true} />
              <MeterDetailModal />
            </SignedIn>

            {isReadingActive ? (
              <button onClick={() => stopReading()} className="stop-button">
                Stop
              </button>
            ) : (
              <button onClick={() => startReading()} className="start-button">
                Start
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
