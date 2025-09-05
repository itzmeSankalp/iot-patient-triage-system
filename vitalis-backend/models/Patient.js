const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    patientId: { type: String, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    chiefComplaint: { type: String, required: true },
    admissionTimestamp: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['Active', 'Discharged'], 
        default: 'Active' 
    },
    initialVitals: {
        HR: Number,
        SpO2: Number,
        Temp: Number
    },
    triageScore: {
        type: Number,
        default: 0
    },
    ecgRecording: {
        type: [Number],
        default: []
    }
});

module.exports = mongoose.model('Patient', patientSchema);