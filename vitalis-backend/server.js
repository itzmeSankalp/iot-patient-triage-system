const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

const patientRoutes = require('./routes/patients')(io);
app.use('/api/patients', patientRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connection successful!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// --- CORRECTED LOGIC: Global state for recording ---
let recordingState = {
    isRecording: false,
    buffer: [],
    timeout: null,
    requestingSocket: null // To remember who asked for the recording
};

// Listen for incoming data from ANY client and handle it globally
io.on('connection', (socket) => {
    console.log(`A client connected: ${socket.id}`);

    // Listen for the command from the receptionist to start capturing
    socket.on('start-ecg-recording', () => {
        // Only start a new recording if one isn't already in progress
        if (!recordingState.isRecording) {
            recordingState.isRecording = true;
            recordingState.buffer = [];
            recordingState.requestingSocket = socket; // Remember which client to send the data back to
            console.log(`Recording ECG for 10 seconds, requested by: ${socket.id}`);

            // Set a timer to automatically stop recording
            recordingState.timeout = setTimeout(() => {
                if (recordingState.isRecording) {
                    recordingState.isRecording = false;
                    // Send the completed buffer back to the specific client that requested it
                    if (recordingState.requestingSocket) {
                        recordingState.requestingSocket.emit('ecg-recording-complete', recordingState.buffer);
                    }
                    console.log(`Finished ECG recording (timeout). Captured ${recordingState.buffer.length} points.`);
                }
            }, 10000); // 10 seconds
        }
    });

    // Listen for data coming from the 'vitalis-reader-script'
    socket.on('vitals-data', (data) => {
        if (data.startsWith('G:') && recordingState.isRecording) {
            const ecgValue = parseInt(data.substring(2));
            if (!isNaN(ecgValue)) {
                recordingState.buffer.push(ecgValue);
            }
        } else if (data.startsWith('D:')) {
            const vitals = {};
            data.substring(2).split(',').forEach(part => {
                const [key, value] = part.split(':');
                vitals[key] = parseFloat(value);
            });
            io.emit('live-vitals-for-admission', vitals);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // If the requesting client disconnects, stop the recording process
        if (recordingState.requestingSocket && recordingState.requestingSocket.id === socket.id) {
            clearTimeout(recordingState.timeout);
            recordingState.isRecording = false;
            recordingState.requestingSocket = null;
            console.log("Recording cancelled due to client disconnect.");
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});