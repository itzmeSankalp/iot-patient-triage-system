import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import PatientDetailModal from './PatientDetailModal';
import './DoctorDashboard.css';

const socket = io('http://localhost:5000');

const getTriageColor = (score) => {
  if (score >= 15) return 'critical';
  if (score >= 5) return 'warning';
  return 'stable';
};

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchAndProcessPatients = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/patients/active');
      const data = await response.json();
      setPatients(data);
    } catch (error) { 
      console.error("Failed to fetch patients:", error); 
    }
  }, []);

  // --- THIS useEffect IS THE CORE FIX ---
  // It handles all real-time updates from the server correctly.
  useEffect(() => {
    // Fetch the initial list when the component first loads
    fetchAndProcessPatients();
    
    // Listener for when a new patient is admitted by the receptionist
    const handleNewPatient = (newPatient) => {
        setPatients(prev => [...prev, newPatient].sort((a,b) => b.triageScore - a.triageScore));
    };

    // Listener for when a patient's status or notes are updated
    const handlePatientUpdate = (updatedPatient) => {
        setPatients(prev => 
            prev.map(p => p._id === updatedPatient._id ? updatedPatient : p)
                .sort((a,b) => b.triageScore - a.triageScore)
        );
        // If the modal is open for the updated patient, refresh its data too
        if(selectedPatient?._id === updatedPatient._id) {
            setSelectedPatient(updatedPatient);
        }
    };

    // Listener for when a patient is discharged
    const handlePatientDischarged = ({ patientId }) => {
        setPatients(prev => prev.filter(p => p._id !== patientId));
    };

    // Activate all listeners
    socket.on('new-patient-admitted', handleNewPatient);
    socket.on('patient-updated', handlePatientUpdate);
    socket.on('patient-discharged', handlePatientDischarged);

    // Clean up listeners when the component is unmounted
    return () => {
      socket.off('new-patient-admitted');
      socket.off('patient-updated');
      socket.off('patient-discharged');
    };
  }, [fetchAndProcessPatients, selectedPatient]);

  const handleStatusChange = async (patientId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/patients/${patientId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
        console.error("Failed to update status:", error);
    }
  };

  const handleDischarge = async (patientId) => {
      if(window.confirm("Are you sure you want to discharge this patient to the archive?")) {
        try {
            await fetch(`http://localhost:5000/api/patients/${patientId}/discharge`, { method: 'PUT' });
        } catch (error) {
            console.error("Failed to discharge patient:", error);
        }
      }
  };
  
  const handleOpenModal = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  return (
    <div className="doctor-dashboard-container">
      <header><h1>Doctor's Triage Dashboard</h1></header>
      <div className="patient-grid">
        {patients.map((patient, index) => (
          <div key={patient._id} className="patient-card">
            <div className={`triage-signal ${getTriageColor(patient.triageScore)}`}></div>
            <div className="patient-content">
                <div className="patient-info" onClick={() => handleOpenModal(patient)}>
                    <span className="priority-number">{index + 1}</span>
                    <div className="patient-name-id">
                        <h3>{patient.patientId} - {patient.name}</h3>
                        <p>{patient.age}, {patient.gender}</p>
                    </div>
                </div>
                <div className="patient-vitals" onClick={() => handleOpenModal(patient)}>
                    <div>❤️ HR: <span>{patient.initialVitals.HR?.toFixed(0) || '--'}</span></div>
                    <div>💨 SpO2: <span>{patient.initialVitals.SpO2?.toFixed(0) || '--'}%</span></div>
                    <div>🌡️ Temp: <span>{patient.initialVitals.Temp?.toFixed(1) || '--'}°C</span></div>
                </div>
                <div className="patient-status">
                    Status: <span className="status-text">{patient.status}</span>
                </div>
                <div className="patient-actions">
                    <select 
                        value={patient.status} 
                        onChange={(e) => handleStatusChange(patient._id, e.target.value)}
                        className="status-dropdown"
                    >
                        <option value="Active">Active</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="Ready for Discharge">Ready for Discharge</option>
                    </select>
                    <button className="discharge-button" onClick={() => handleDischarge(patient._id)}>Discharge</button>
                </div>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && <PatientDetailModal patient={selectedPatient} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default DoctorDashboard;