import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ReceptionistDashboard.css';

const socket = io('http://localhost:5000');
const ECG_RECORDING_DURATION = 10; // seconds

const ReceptionistDashboard = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [liveVitals, setLiveVitals] = useState({ HR: '--', SpO2: '--', Temp: '--' });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [capturedEcgData, setCapturedEcgData] = useState(null);

  useEffect(() => {
    socket.on('live-vitals-for-admission', (vitals) => {
      setLiveVitals(vitals);
    });

    socket.on('ecg-recording-complete', (ecgData) => {
        setCapturedEcgData(ecgData);
        setIsRecording(false);
        setStatusMessage(`ECG capture complete. Ready to admit.`);
    });

    return () => {
      socket.off('live-vitals-for-admission');
      socket.off('ecg-recording-complete');
    };
  }, []);

  const handleStartEcgCapture = () => {
    setIsRecording(true);
    setCapturedEcgData(null);
    setRecordingProgress(0);
    setStatusMessage('Capturing 10-second ECG...');
    socket.emit('start-ecg-recording');

    const interval = setInterval(() => {
        setRecordingProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + (100 / ECG_RECORDING_DURATION);
        });
    }, 1000);
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!capturedEcgData) {
      setStatusMessage('Error: Please capture the 10-second ECG before admitting.');
      return;
    }

    const vitalsToSend = {
        HR: typeof liveVitals.HR === 'number' ? liveVitals.HR : 0,
        SpO2: typeof liveVitals.SpO2 === 'number' ? liveVitals.SpO2 : 0,
        Temp: typeof liveVitals.Temp === 'number' ? liveVitals.Temp : 0,
    };

    const patientData = {
      name,
      age: parseInt(age),
      gender,
      chiefComplaint,
      initialVitals: vitalsToSend,
      ecgRecording: capturedEcgData,
    };

    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to admit patient. Check backend server logs.');
      }
      
      const newPatient = await response.json();
      
      setStatusMessage(`Admitted ${newPatient.name}. Vitals Logged: HR ${newPatient.initialVitals.HR.toFixed(0)}, SpO2 ${newPatient.initialVitals.SpO2.toFixed(0)}%, Temp ${newPatient.initialVitals.Temp.toFixed(1)}°C`);
      
      setName(''); setAge(''); setChiefComplaint(''); setCapturedEcgData(null); setRecordingProgress(0);
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="receptionist-container">
      <header><h1>Receptionist Dashboard</h1></header>
      <div className="receptionist-content">
        <div className="admit-form-container">
          <h3>Step 2: Admit Patient</h3>
          <form onSubmit={handleAdmit}>
            <input type="text" placeholder="Patient Name" value={name} onChange={e => setName(e.target.value)} required />
            <input type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} required />
            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <textarea placeholder="Chief Complaint" value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} required></textarea>
            <button type="submit" disabled={!capturedEcgData || isRecording}>Admit Patient</button>
          </form>
        </div>
        <div className="capture-control-panel">
          <h3>Step 1: Capture Vitals</h3>
          <p>Attach sensors to the patient before admitting.</p>
          <div className="live-vitals-display">
            <h4>Live Sensor Data</h4>
            <div className="vitals-grid">
                <div className="vital-box"><h4>❤️ HR</h4><span>{typeof liveVitals.HR === 'number' ? liveVitals.HR.toFixed(0) : '--'}</span></div>
                <div className="vital-box"><h4>💨 SpO2</h4><span>{typeof liveVitals.SpO2 === 'number' ? liveVitals.SpO2.toFixed(0) : '--'}</span></div>
                <div className="vital-box"><h4>🌡️ Temp</h4><span>{typeof liveVitals.Temp === 'number' ? liveVitals.Temp.toFixed(1) : '--'}</span></div>
            </div>
          </div>
          <div className="ecg-capture-section">
            <h4>ECG Snapshot</h4>
            <button onClick={handleStartEcgCapture} disabled={isRecording}>
                {isRecording ? `Recording... (${Math.round(recordingProgress)}%)` : 'Start 10s ECG Capture'}
            </button>
            {isRecording && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${recordingProgress}%` }}></div>
                </div>
            )}
            {capturedEcgData && !isRecording && (
                <div className="capture-success">✓ ECG Captured Successfully</div>
            )}
          </div>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;