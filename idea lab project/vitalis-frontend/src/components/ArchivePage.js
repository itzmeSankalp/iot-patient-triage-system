import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ArchivePage.css';

// Register the required components for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- MODAL SUB-COMPONENT ---
const PatientHistoryModal = ({ patient, onClose }) => {
    if (!patient) return null;

    const ecgChartData = {
        labels: patient.ecgRecording?.map((_, index) => index) || [],
        datasets: [{
            label: 'ECG Snapshot (at Admission)',
            data: patient.ecgRecording || [],
            borderColor: '#22c55e',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
        }]
    };
    
    const ecgChartOptions = {
        animation: false,
        scales: { y: { min: 0, max: 1024 }, x: { display: false } },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        const vitals = patient.initialVitals || {}; // Safety check
        
        doc.setFontSize(20);
        doc.text(`Patient Report: ${patient.name}`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Patient ID: ${patient.patientId}`, 14, 30);
        doc.text(`Admission Date: ${new Date(patient.admissionTimestamp).toLocaleString()}`, 14, 38);
        doc.text(`Status: ${patient.status}`, 14, 46);
        doc.text(`Initial Vitals: HR: ${vitals.HR || 'N/A'}, SpO2: ${vitals.SpO2 || 'N/A'}, Temp: ${vitals.Temp || 'N/A'}°C`, 14, 54);

        if (patient.notes && patient.notes.length > 0) {
            doc.autoTable({
                startY: 65,
                head: [['Date', 'Doctor Note']],
                body: patient.notes.map(n => [new Date(n.timestamp).toLocaleString(), n.text]),
            });
        }
        
        doc.save(`patient-report-${patient.patientId}.pdf`);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>History for {patient.name} ({patient.patientId})</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body-grid">
                    <div className="modal-section ecg-section">
                        <h4>ECG Snapshot (10s at Admission)</h4>
                        <div className="chart-wrapper">
                            <Line options={ecgChartOptions} data={ecgChartData} />
                        </div>
                    </div>
                    <div className="modal-section notes-section">
                        <h4>Clinical Notes</h4>
                        <div className="notes-list">
                            {patient.notes && patient.notes.length > 0 ? 
                                [...patient.notes].reverse().map(note => (
                                    <div key={note._id} className="note">
                                        <p>{note.text}</p>
                                        <span>{new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                )) : 
                                <p>No notes were recorded for this patient.</p>
                            }
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={handleExportPdf} className="export-button">Export as PDF</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN ARCHIVE PAGE COMPONENT ---
const ArchivePage = () => {
    const [archivedPatients, setArchivedPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/patients/archive')
            .then(res => res.json())
            .then(data => setArchivedPatients(data))
            .catch(err => console.error("Failed to fetch archive:", err));
    }, []);

    const filteredPatients = useMemo(() =>
        archivedPatients.filter(p =>
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.patientId && p.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [archivedPatients, searchTerm]);

    return (
        <div className="archive-container">
            <header>
                <h1>Patient Archive</h1>
                <p>Search for and view records of all discharged patients.</p>
            </header>
            <div className="search-bar-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name or ID (e.g., P-1001)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Initial Vitals (HR/SpO2/Temp)</th>
                            <th>Admission Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(patient => {
                            // --- THIS IS THE FINAL FIX ---
                            // Check each vital individually to ensure it's a number before formatting.
                            const vitals = patient.initialVitals || {};
                            const hrDisplay = typeof vitals.HR === 'number' ? vitals.HR.toFixed(0) : 'N/A';
                            const spo2Display = typeof vitals.SpO2 === 'number' ? vitals.SpO2.toFixed(0) : 'N/A';
                            const tempDisplay = typeof vitals.Temp === 'number' ? vitals.Temp.toFixed(1) : 'N/A';

                            return (
                                <tr key={patient._id}>
                                    <td>{patient.patientId || 'N/A'}</td>
                                    <td>{patient.name || 'N/A'}</td>
                                    <td>{patient.age || 'N/A'}</td>
                                    <td>
                                        {`${hrDisplay} / ${spo2Display}% / ${tempDisplay}°C`}
                                    </td>
                                    <td>{new Date(patient.admissionTimestamp).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => setSelectedPatient(patient)} className="view-button">
                                            View History
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {selectedPatient && <PatientHistoryModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
        </div>
    );
};

export default ArchivePage;