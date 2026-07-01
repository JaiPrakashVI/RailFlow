# RailFlow: Railway Dispatching & Telemetry Digital Twin

Contributers : 1. https://github.com/idhayathulla-dev
               2. https://github.com/JaiPrakashVI

RailFlow is a real-time railway simulation, scheduling optimization, and delay prediction dashboard. It simulates train movement along a station network, checks for platform/track conflicts, runs mathematical optimization models to resolve scheduling clashes, and predicts delay propagation under various operational conditions.

## Project Structure

```
Train_scheduler/
├── backend/            # FastAPI Backend
│   ├── analytics/      # Dashboard metrics & KPI calculation engine
│   ├── app/            # REST API endpoints, Auth, SQLite models, WebSockets
│   ├── data/           # Stations, tracks, and historical telemetry data
│   ├── ml/             # Delay prediction models (Random Forest, LightGBM, XGBoost)
│   ├── optimization/   # OR-Tools CP-SAT scheduler & heuristic router
│   ├── reports/        # PDF/HTML and CSV reporting modules
│   ├── simulation/     # Stateful railway network simulator loop
│   └── tests/          # Integration & unit test suite
└── frontend/           # React + TypeScript + Vite Dashboard
    ├── public/         # Icons & static assets
    └── src/            # Components, views, custom hooks, and styling
```

---

## Features

- **Stateful Simulator:** A background loop simulating train speeds, platform occupancy, and signal blocks under varying weather conditions.
- **CP-SAT Scheduling Optimizer:** Resolves track conflicts (especially single-line segments) by shifting departures using Google OR-Tools.
- **ML Delay Predictor:** Evaluates features (congestion, weather, signal delay, maintenance blocks) to forecast arrival delays.
- **Real-Time Telemetry:** Streams simulated train coordinates and incident alerts to the client dashboard via WebSockets.
- **Operational Dashboards:** Views for dispatch control, congestion heatmaps, digital twins of trains/stations, and reporting.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ & npm

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn backend.app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`. Swagger documentation can be accessed at `http://localhost:8000/docs`.

5. Run unit tests:
   ```bash
   python -m unittest backend/tests/test_backend.py
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.
