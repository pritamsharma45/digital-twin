import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function EnergyMeter() {
  const [reading, setReading] = useState(1000);

  useEffect(() => {
    socket.on('newReading', (newReading) => {
      setReading(newReading);
    });

    return () => socket.off('newReading');
  }, []);

  return (
    <div>
      <h1>Live Energy Meter</h1>
      <p>Current Reading: {reading} kWh</p>
    </div>
  );
}

export default EnergyMeter;
