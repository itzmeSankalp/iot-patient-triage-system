import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <nav>
          <h1>Vitalis</h1>
          <Link to="/auth" className="login-button">Login / Register</Link>
        </nav>
        <nav>
            <Link to="/archive">Patient Archive</Link>
        </nav>
        <div className="hero-section">
          <h2>Intelligent Triage, Real-Time Care</h2>
          <p>An integrated hardware and software solution for prioritizing patient care using live vitals from IoT sensors.</p>
          <Link to="/auth" className="cta-button">Access Dashboard</Link>
        </div>
      </header>

      <main className="homepage-main">
        <section id="about">
          <h3>About The Project</h3>
          <p>Vitalis bridges the gap between patient intake and expert consultation. By leveraging an Arduino-powered sensor suite, we capture real-time patient vitals—including heart rate, SpO2, body temperature, and a live ECG stream. This data is instantly sent to a cloud dashboard where our backend algorithm calculates a severity score, allowing doctors to see a dynamically prioritized list of patients, ensuring that those in most critical need are attended to first.</p>
        </section>
        <section id="features">
          <h3>Core Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Real-Time Vitals</h4>
              <p>Live data stream from MAX30100 and MLX90614 sensors for up-to-the-second vitals.</p>
            </div>
            <div className="feature-card">
              <h4>Live ECG Waveform</h4>
              <p>A continuous ECG graph powered by an AD8232 sensor, viewable directly on the dashboard.</p>
            </div>
            <div className="feature-card">
              <h4>Automated Triage</h4>
              <p>A smart algorithm scores patient severity and automatically sorts the patient queue.</p>
            </div>
             <div className="feature-card">
              <h4>Role-Based Access</h4>
              <p>Separate, secure dashboards for doctors and receptionists with distinct functionalities.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;