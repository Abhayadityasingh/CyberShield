# CyberShield
## AI-Powered Cyber Threat Detection & Monitoring System

CyberShield is a full-stack cybersecurity project that monitors login activity, detects suspicious behaviour, and displays security alerts through a real-time dashboard.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Real-time Communication: Socket.IO
- Authentication: JWT
- Machine Learning: Python, FastAPI, Isolation Forest

## Main Features

- User registration and login
- Protected dashboard
- Real-time security event monitoring
- Rule-based cyber threat detection
- AI-based login anomaly detection
- Threat severity and risk scores
- Threat investigation and status management
- Simulation Lab for generating synthetic security events
- Separate simulated and application-source records

## Detection Capabilities

CyberShield includes six rule-based detection scenarios:

1. Brute-force login attempts
2. Successful login after repeated failures
3. Credential stuffing
4. Unusual login time
5. Login location anomaly
6. Suspicious login frequency

An additional Isolation Forest model identifies unusual login patterns using extracted behavioural features.

The ML anomaly score is not an attack probability. The current model is a prototype trained using synthetic data.

## Project Structure

- frontend/ - React user interface
- backend/ - Express API, detection engine and database integration
- ml-service/ - Python machine learning service
- docs/ - Project documentation

## Local Development

The project requires Node.js, Python and MongoDB.

Install dependencies separately inside the frontend, backend and ml-service directories.

Start the three services:

Backend:
cd backend
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

ML Service:
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000

Default local addresses:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- ML Service: http://127.0.0.1:8000

Environment variables must be configured locally before running the project. Actual .env files containing credentials are not included in the submission.

## Testing

The project has been tested with synthetic login scenarios covering all six rule-based detections and ML anomaly detection.

The backend detection test script clears existing simulated records before generating fresh test data. Do not run it when existing simulation results must be preserved.

## Disclaimer

CyberShield is an educational cybersecurity prototype. Its synthetic-data ML model and simulated attack scenarios are intended for demonstration and learning, not production security decisions.
