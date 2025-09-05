Vitalis - Real-Time IoT Patient Triage System


About The Project
Vitalis is a full-stack IoT application designed to improve clinical efficiency by capturing real-time patient vitals and automatically prioritizing them based on medical urgency. This system bridges the gap between patient intake and expert consultation, ensuring that doctors can attend to the most critical patients first.

The project consists of three main parts:

Hardware: An Arduino-based device with ECG, Pulse Oximeter, and Temperature sensors captures patient data.

Backend: A Node.js server that processes incoming data, calculates a risk score, and manages patient records in a MongoDB database.

Frontend: A React application with separate, real-time dashboards for receptionists (to admit patients and capture vitals) and doctors (to view the prioritized patient queue).

Key Features
One-Time Vitals Capture: Receptionists capture a 10-second ECG snapshot and a final set of vitals (HR, SpO2, Temp) at the moment of admission.

Automated Triage: The backend calculates a risk score and automatically sorts the patient queue on the doctor's dashboard.

Prioritized Dashboard: Doctors see a clean, color-coded list of active patients, ranked by medical urgency.

Historical Archive: All discharged patient records, including their admission vitals and ECG snapshot, are saved and searchable in a patient archive.

Real-Time Communication: Built with WebSockets for instant data transfer and UI updates.

Tech Stack
Hardware: Arduino, AD8232 (ECG), MAX30100 (Pulse/SpO2), MLX90614 (Temp)

Frontend: React.js, Chart.js, Socket.IO Client

Backend: Node.js, Express.js, Mongoose, Socket.IO

Database: MongoDB Atlas

How to Run Locally
(Instructions for another developer to run your project on their machine)

Clone the repository: git clone https://github.com/your-username/your-repo.git

Setup Backend: cd vitalis-backend, npm install, create a .env file with your MONGO_URI, then node server.js.

Setup Frontend: cd vitalis-frontend, npm install, then npm start.

Run Reader Script: cd vitalis-reader-script, npm install, update the Arduino COM port in reader.js, then node reader.js.
