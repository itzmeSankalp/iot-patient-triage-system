const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Counter = require('../models/Counter');

// Helper function to get the next patient ID
async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName, { $inc: { seq: 1 } }, { new: true, upsert: true }
    );
    return `P-${sequenceDocument.seq}`;
}

// Triage logic to calculate a risk score
const calculateTriageScore = (vitals) => {
  let score = 0;
  if (!vitals) return 0;
  const { HR, SpO2 } = vitals;
  if (HR < 50 || HR > 130) score += 10;
  else if (HR < 60 || HR > 110) score += 5;
  if (SpO2 < 92) score += 15;
  else if (SpO2 < 95) score += 5;
  return score;
};

module.exports = function(io) {
    // POST a new patient
    router.post('/', async (req, res) => {
        try {
            const patientId = await getNextSequenceValue('patientId');
            const { name, age, gender, chiefComplaint, initialVitals, ecgRecording } = req.body;
            const triageScore = calculateTriageScore(initialVitals);

            const patient = new Patient({
                patientId, name, age, gender, chiefComplaint, initialVitals, triageScore, ecgRecording
            });

            const savedPatient = await patient.save();
            io.emit('new-patient-admitted', savedPatient);
            res.status(201).json(savedPatient);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // GET all active patients
    router.get('/active', async (req, res) => {
        try {
            const patients = await Patient.find({ status: { $ne: 'Discharged' } }).sort({ triageScore: -1 });
            res.json(patients);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // GET all archived patients
    router.get('/archive', async (req, res) => {
        try {
            const patients = await Patient.find({ status: 'Discharged' }).sort({ admissionTimestamp: -1 });
            res.json(patients);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // PUT to update patient status
    router.put('/:id/status', async (req, res) => {
        try {
            const { status } = req.body;
            const updatedPatient = await Patient.findByIdAndUpdate(
                req.params.id, { status }, { new: true }
            );
            io.emit('patient-updated', updatedPatient);
            res.json(updatedPatient);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // POST to add a doctor's note
    router.post('/:id/notes', async (req, res) => {
        try {
            const { text } = req.body;
            const updatedPatient = await Patient.findByIdAndUpdate(
                req.params.id,
                { $push: { notes: { text, timestamp: new Date() } } },
                { new: true }
            );
            io.emit('patient-updated', updatedPatient);
            res.json(updatedPatient);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // PUT to discharge a patient
    router.put('/:id/discharge', async (req, res) => {
        try {
            const patient = await Patient.findByIdAndUpdate(
                req.params.id, 
                { status: 'Discharged' },
                { new: true }
            );
            io.emit('patient-discharged', { patientId: patient._id });
            res.json(patient);
        } catch(err) {
            res.status(400).json({ message: err.message });
        }
    });

    return router;
};