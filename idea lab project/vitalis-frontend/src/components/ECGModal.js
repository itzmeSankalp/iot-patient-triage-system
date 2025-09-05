import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import io from 'socket.io-client';
import './ECGModal.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
const socket = io('http://localhost:5000');

const ECGModal = ({ patient, onClose }) => {
  const [ecgData, setEcgData] = useState({
    labels: Array(150).fill(''),
    datasets: [{
      label: 'ECG Waveform',
      data: Array(150).fill(512), // Start at midpoint
      borderColor: '#22c55e',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
    }],
  });

  useEffect(() => {
    const handleEcgData = (newPoint) => {
      setEcgData(prevData => {
        const data = prevData.datasets[0].data.slice(1);
        data.push(parseInt(newPoint));
        return { ...prevData, datasets: [{ ...prevData.datasets[0], data }] };
      });
    };
    socket.on('ecg-graph-data', handleEcgData);
    return () => socket.off('ecg-graph-data', handleEcgData);
  }, []);

  const chartOptions = {
    animation: false,
    scales: { y: { min: 0, max: 1024 }, x: { ticks: { display: false } } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Live ECG: {patient.name}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <Line options={chartOptions} data={ecgData} />
        </div>
      </div>
    </div>
  );
};

export default ECGModal;