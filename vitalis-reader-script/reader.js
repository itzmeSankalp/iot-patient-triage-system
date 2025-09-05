// This script runs on the receptionist's laptop. It reads data from the
// Arduino's serial port and forwards it to the main backend server.

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { io } from 'socket.io-client';

// --- CONFIGURATION ---
// !! IMPORTANT !!
// Replace 'COM3' with the port your Arduino is connected to.
// Find this in your Arduino IDE under (Tools > Port).
// On macOS or Linux, it will look like '/dev/tty.usbmodemXXXX'.
const ARDUINO_PORT_PATH = 'COM8';
const SERVER_URL = 'http://localhost:5000';

// --- SCRIPT LOGIC ---
console.log('Attempting to connect to server at', SERVER_URL);
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log(`✅ Successfully connected to main server with ID: ${socket.id}`);
});

socket.on('connect_error', (err) => {
  console.error(`❌ Error connecting to server: ${err.message}`);
  console.log('Is the main `vitalis-backend` server running?');
});

try {
  console.log(`Attempting to open serial port: ${ARDUINO_PORT_PATH}`);
  const port = new SerialPort({ path: ARDUINO_PORT_PATH, baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.on('open', () => {
    console.log(`✅ Serial port ${ARDUINO_PORT_PATH} is open.`);
  });

  parser.on('data', (data) => {
    console.log(`<- Data from Arduino: ${data}`);
    // Forward the data to the server
    socket.emit('vitals-data', data);
  });

  port.on('error', (err) => {
    console.error('❌ Serial Port Error: ', err.message);
  });
} catch (err) {
  console.error(`❌ Could not create serial port: ${err.message}`);
  console.log('Is the Arduino plugged in? Is the port path correct?');
}