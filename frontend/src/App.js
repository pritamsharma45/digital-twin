"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
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
import { useForm } from "react-hook-form";

// Define socket connection based on environment
const socket = io(
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_BACKEND_URL_PROD
    : process.env.REACT_APP_BACKEND_URL_DEV
);

// Apps Script URL from environment variable
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

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

// Simple memoized modal component
const Modal = memo(
  ({ value, onChange, onClose, onSend, onPay, isSending, meterInfo }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Meter Details - {meterInfo.id}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <h3>Current Reading</h3>
            <div className="reading-input-container">
              <input
                type="number"
                value={value}
                onChange={onChange}
                className="reading-input"
                step="0.01"
                min="0"
              />
              <span className="reading-unit">kWh</span>
            </div>
          </div>
          <div className="detail-row">
            <h3>Supplier Information</h3>
            <p>Supplier: {meterInfo.supplier}</p>
            <p>Tariff Type: {meterInfo.tariff}</p>
          </div>
          <div className="detail-row">
            <h3>Cost Calculation</h3>
            <p>Rate per kWh: {meterInfo.cost}p</p>
            <p>Total Cost: £{meterInfo.total}</p>
          </div>
          <div className="detail-row">
            <button
              className="send-reading-button"
              onClick={onSend}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Meter Reading"}
            </button>
            <button
              className="paypal-payment-button"
              onClick={onPay}
              disabled={isSending}
            >
              Pay £{meterInfo.total}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
);

Modal.displayName = "Modal";

export default function EnergyMeter() {
  const [readings, setReadings] = useState({}); // Start with an empty state
  const [loading, setLoading] = useState(true); // Loading state to track when readings are received
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // Update readings with dynamic meter_id and reading data
  const updateReading = useCallback(({ meter_id, reading }) => {
    setReadings((prevReadings) => ({
      ...prevReadings,
      [meter_id]: {
        ...meterData[meter_id],
        reading: reading.toFixed(2),
        total: ((reading * meterData[meter_id].cost) / 100).toFixed(2),
      },
    }));
    setLoading(false);
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

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setModalData((prev) => ({
        ...prev,
        editedReading: value,
        total: ((numValue * prev.cost) / 100).toFixed(2),
      }));
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    startReading();
  }, []);

  const handleSendReading = useCallback(async () => {
    if (modalData && user) {
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
              id: modalData.id,
              reading: modalData.editedReading,
              supplier: modalData.supplier,
              tariff: modalData.tariff,
              cost: modalData.cost,
              total: modalData.total,
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Meter reading details sent to your email!");
          setShowModal(false);
          startReading();
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
  }, [modalData, user]);

  const handlePay = useCallback(() => {
    console.log("Paying £" + modalData.total);
  }, [modalData]);

  const handleMeterSelect = useCallback((meterId, data) => {
    stopReading();
    const meterSnapshot = {
      id: meterId,
      reading: data.reading,
      supplier: data.supplier,
      tariff: data.tariff,
      cost: data.cost,
      total: data.total,
      editedReading: data.reading,
    };
    setModalData(meterSnapshot);
    setInputValue(data.reading);
    setShowModal(true);
  }, []);

  // Simplified modal rendering
  const renderModal = () => {
    if (!modalData || !showModal) return null;

    return (
      <Modal
        value={inputValue}
        onChange={handleInputChange}
        onClose={handleModalClose}
        onSend={handleSendReading}
        onPay={handlePay}
        isSending={isSending}
        meterInfo={modalData}
      />
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
          <h2 style={{ fontWeight: "bold", color: "blue" }}>SPYDER</h2>
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
        {/* <h2 className="title" style={{ fontWeight: "bold", color: "blue" }}>
          SPYDER
        </h2> */}
        <h3 className="title">Price Comparison Smart Energy Meter Reader</h3>
        <p>
          The <strong>SPYDER</strong> Digital Twin Smart Energy Meter Reader,
          helps you find the best electricity meter at the most competitive
          price. Compare diferent meters, check prices and choose the right
          option to save on energy bills.
        </p>
        <SignedOut>
          <p>
            Start comparing now and make smarter choices for your electricity
            usage. Please
            <SignInButton mode="modal" className="login-button">
              {" "}
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
              {renderModal()}

              {isReadingActive ? (
                <button onClick={() => stopReading()} className="stop-button">
                  Stop
                </button>
              ) : (
                <button onClick={() => startReading()} className="start-button">
                  Start
                </button>
              )}
            </SignedIn>
          </div>
        )}
      </div>
    </div>
  );
}
