import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './ECGModal.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PatientDetailModal = ({ patient, onClose }) => {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return; // Prevent empty notes
    try {
      // Send the new note to the backend
      await fetch(`http://localhost:5000/api/patients/${patient._id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: noteText }),
      });
      // Clear the input field after successful submission
      setNoteText('');
      // The DoctorDashboard's 'patient-updated' listener will handle updating the view
    } catch (error) {
        console.error("Failed to add note:", error);
    }
  };

  const recordedEcgData = {
    labels: patient.ecgRecording.map((_, index) => index),
    datasets: [{
      label: '10s ECG Snapshot',
      data: patient.ecgRecording,
      borderColor: '#22c55e',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    animation: false,
    scales: { y: { min: 0, max: 1024 }, x: { display: false } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Details for {patient.name} ({patient.patientId})</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body-grid">
            <div className="modal-section ecg-section">
                <h4>ECG Snapshot (10s at Admission)</h4>
                <div className="chart-wrapper">
                    <Line options={chartOptions} data={recordedEcgData} />
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
                        <p>No notes for this patient.</p>
                    }
                </div>
                <form onSubmit={handleAddNote} className="note-form">
                    <textarea 
                        value={noteText} 
                        onChange={e => setNoteText(e.target.value)} 
                        placeholder="Add a new clinical note..."
                    ></textarea>
                    <button type="submit">Add Note</button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;