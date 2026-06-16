import asyncio
import os
import random
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import init_db, get_db, User, Station, Track, Signal, Train, Schedule, Conflict, Alert, AuditLog, Prediction, OptimizationRun
from backend.app.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_operator, require_admin
from backend.app.websocket import manager
from backend.simulation.simulator import RailwaySimulator
from backend.optimization.optimizer import RailwayOptimizer
from backend.ml.delay_predictor import DelayPredictor
from backend.analytics.analytics import AnalyticsEngine
from backend.reports.reporting import ReportingModule

app = FastAPI(title="RailFlow AI API Gateway", version="1.0.0")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Instances
simulator = RailwaySimulator()
optimizer = RailwayOptimizer()
predictor = DelayPredictor()
analytics = AnalyticsEngine()
reports = ReportingModule()

# Background task reference
sim_task: Optional[asyncio.Task] = None

@app.on_event("startup")
def startup_event():
    init_db()
    # Populate default simulated state
    db = SessionLocal = next(get_db())
    simulator.initialize_simulation(db, 80) # Seed with 80 trains for scaling

async def run_simulation_loop():
    """Background asynchronous task that ticks simulation forward in real-time"""
    db = next(get_db())
    try:
        while True:
            if simulator.is_running:
                # Sleep based on speed (1x -> 1s, 5x -> 0.2s, 10x -> 0.1s, etc.)
                sleep_sec = max(0.01, 1.0 / max(0.1, simulator.sim_speed))
                await asyncio.sleep(sleep_sec)
                
                # Tick simulator
                simulator.step(db, 1.0) # step 1 minute forward
            else:
                await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        pass
    finally:
        db.close()

@app.post("/api/simulation/start")
def start_simulation():
    global sim_task
    simulator.is_running = True
    if sim_task is None or sim_task.done():
        sim_task = asyncio.create_task(run_simulation_loop())
    return {"status": "Simulation running", "speed": simulator.sim_speed, "mode": simulator.sim_mode}

@app.post("/api/simulation/pause")
def pause_simulation():
    simulator.is_running = False
    return {"status": "Simulation paused"}

@app.post("/api/simulation/resume")
def resume_simulation():
    simulator.is_running = True
    return {"status": "Simulation resumed"}

@app.post("/api/simulation/reset")
def reset_simulation(db: Session = Depends(get_db)):
    global sim_task
    simulator.is_running = False
    if sim_task and not sim_task.done():
        sim_task.cancel()
    simulator.initialize_simulation(db, 80)
    simulator.sim_time = datetime.strptime("05:00", "%H:%M")
    return {"status": "Simulation reset successfully"}

@app.post("/api/simulation/speed")
def change_speed(speed: float = Query(..., ge=0.1, le=100.0)):
    simulator.sim_speed = speed
    return {"speed": simulator.sim_speed}

@app.post("/api/simulation/mode")
def change_mode(mode: str = Query(...)):
    if mode not in ["Normal", "Rush Hour", "Festival Traffic", "Emergency", "Maintenance Shutdown"]:
        raise HTTPException(status_code=400, detail="Invalid simulation mode")
    simulator.sim_mode = mode
    return {"mode": simulator.sim_mode}

@app.post("/api/simulation/trigger-emergency")
def trigger_emergency(type: str, detail: str, db: Session = Depends(get_db)):
    """Triggers emergencies: track blockage, signal failures, train breakdowns, weather storms"""
    alert_msg = f"EMERGENCY TRIGGERED: {type.upper()} - {detail}"
    db.add(Alert(type="Emergency", severity="Critical", message=alert_msg))
    
    if type == "accident" or type == "track_blockage":
        # Block a random active track segment
        active_tracks = db.query(Track).filter(Track.status == "Active").all()
        if active_tracks:
            selected = random.choice(active_tracks)
            selected.status = "Blocked"
            db.add(AuditLog(username="System", action="Emergency Blockage", details=f"Track segment {selected.id} set to Blocked."))
            db.commit()
            simulator.network.update_track_status(selected.id, "Blocked")
            
    elif type == "signal_failure":
        # Force random signal to Red
        active_signals = db.query(Signal).all()
        if active_signals:
            selected = random.choice(active_signals)
            selected.state = "Red"
            db.add(AuditLog(username="System", action="Signal Failure", details=f"Signal {selected.id} forced to RED due to failure."))
            db.commit()
            
    elif type == "weather":
        # Set weather to Stormy, affecting all trains
        for t_id, t in simulator.active_trains.items():
            t["weather"] = "Stormy"
        db.add(AuditLog(username="System", action="Weather Storm", details=f"All train weather conditions updated to Stormy (speed reductions)."))
        db.commit()

    elif type == "breakdown":
        # Force a running train to Halt
        running = [t for t in simulator.active_trains.values() if t["status"] == "Running"]
        if running:
            selected = random.choice(running)
            selected["status"] = "Halted"
            selected["delay"] += 30 # Breakdown delay penalty
            db.add(AuditLog(username="System", action="Train Breakdown", details=f"Train {selected['id']} suffered a mechanical breakdown."))
            db.commit()

    db.commit()
    # Broadcast alert
    asyncio.create_task(manager.broadcast({"type": "ALERT", "message": alert_msg, "severity": "Critical"}))
    return {"status": "Emergency action applied"}

# --- AUTH API ---

@app.post("/api/auth/register")
def register(username: str = Query(...), password: str = Query(...), role: str = Query("viewer"), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = get_password_hash(password)
    user = User(username=username, hashed_password=hashed, role=role)
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/api/auth/login")
def login(username: str = Query(...), password: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

@app.get("/api/auth/users", dependencies=[Depends(require_admin)])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- DIGITAL TWIN ASSETS API ---

@app.get("/api/network")
def get_network(db: Session = Depends(get_db)):
    return {
        "stations": db.query(Station).all(),
        "tracks": db.query(Track).all(),
        "signals": db.query(Signal).all(),
        "trains": db.query(Train).all()
    }

@app.get("/api/stations")
def get_stations(db: Session = Depends(get_db)):
    return db.query(Station).all()

@app.get("/api/stations/{id}")
def get_station(id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    # Get arrivals and departures at this station
    schedules = db.query(Schedule).filter(Schedule.station_id == id).all()
    return {
        "station": station,
        "schedules": schedules
    }

@app.get("/api/tracks")
def get_tracks(db: Session = Depends(get_db)):
    return db.query(Track).all()

@app.get("/api/trains")
def get_trains(db: Session = Depends(get_db)):
    return db.query(Train).all()

@app.get("/api/trains/{id}")
def get_train(id: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    schedules = db.query(Schedule).filter(Schedule.train_id == id).all()
    # Get predictions
    pred = db.query(Prediction).filter(Prediction.train_id == id).order_by(Prediction.timestamp.desc()).first()
    
    return {
        "train": train,
        "schedules": schedules,
        "prediction": pred
    }

@app.post("/api/trains", dependencies=[Depends(require_operator)])
def create_train(id: str, name: str, type: str, source: str, destination: str, speed: int, db: Session = Depends(get_db)):
    train = Train(id=id, name=name, type=type, source=source, destination=destination, speed=speed)
    db.add(train)
    db.commit()
    return {"message": "Train created successfully"}

@app.put("/api/trains/{id}", dependencies=[Depends(require_operator)])
def update_train(id: str, name: str, speed: int, status: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    train.name = name
    train.speed = speed
    train.status = status
    db.commit()
    return {"message": "Train updated successfully"}

@app.delete("/api/trains/{id}", dependencies=[Depends(require_admin)])
def delete_train(id: str, db: Session = Depends(get_db)):
    db.query(Train).filter(Train.id == id).delete()
    db.commit()
    return {"message": "Train deleted successfully"}

# --- OPTIMIZATION API ---

@app.post("/api/optimization/run", dependencies=[Depends(require_operator)])
def run_optimization(db: Session = Depends(get_db)):
    trains_list = [
        {
            "id": t.id,
            "name": t.name,
            "type": t.type,
            "departure": next((s.scheduled_departure for s in db.query(Schedule).filter(Schedule.train_id == t.id).all() if s.scheduled_departure is not None), "06:00"),
            "speed": t.speed,
            "delay": t.delay,
            "path": simulator.active_trains[t.id]["path"] if t.id in simulator.active_trains else []
        }
        for t in db.query(Train).all()
    ]
    tracks_list = [{"id": tr.id, "from": tr.from_station_id, "to": tr.to_station_id, "distance": tr.distance, "speed_limit": tr.speed_limit, "single_line": tr.single_line} for tr in db.query(Track).all()]
    
    result = optimizer.optimize_schedules(trains_list, tracks_list)
    
    # Update active simulator state with new optimized departure offsets
    for opt_t in result.get("optimized_trains", []):
        t_id = opt_t["id"]
        if t_id in simulator.active_trains:
            h, m = map(int, opt_t["optimized_departure"].split(":"))
            simulator.active_trains[t_id]["scheduled_departure"] = datetime.strptime(opt_t["optimized_departure"], "%H:%M")
            simulator.active_trains[t_id]["delay"] = opt_t["delay"]
            
    return result

@app.get("/api/optimization/results")
def get_optimization_results(db: Session = Depends(get_db)):
    return db.query(OptimizationRun).order_by(OptimizationRun.timestamp.desc()).all()

@app.post("/api/optimization/reroute/{train_id}", dependencies=[Depends(require_operator)])
def reroute_train(train_id: str, blocked_track_id: str):
    res = optimizer.get_alternative_route(train_id, blocked_track_id)
    if not res:
        raise HTTPException(status_code=404, detail="Alternative path routing failed")
    
    # Update active train route path
    if res.get("success") and train_id in simulator.active_trains:
        simulator.active_trains[train_id]["path"] = res["new_path"]
        simulator.active_trains[train_id]["current_path_index"] = 0 # restart tracker indexing on safety layout
    return res

# --- PREDICTION / DELAY API ---

@app.post("/api/prediction/delay")
def predict_delay(train_id: str, weather: str, congestion: float, signal_delay: int, maintenance: bool, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
        
    train_dict = {"id": train.id, "type": train.type, "delay": train.delay, "speed": train.speed}
    res = predictor.predict_delay(train_dict, weather, congestion, signal_delay, maintenance)
    
    # Persist prediction
    p_record = Prediction(
        train_id=train_id,
        predicted_delay=res["predicted_delay"],
        risk_score=res["risk_score"],
        confidence=res["confidence"]
    )
    db.add(p_record)
    db.commit()
    return res

@app.get("/api/prediction/history")
def get_prediction_history(db: Session = Depends(get_db)):
    return db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(50).all()

@app.get("/api/prediction/model-metrics")
def get_model_comparison():
    return {
        "metrics": predictor.get_comparison_metrics(),
        "feature_importance": predictor.get_importance_summary()
    }

# --- ANALYTICS API ---

@app.get("/api/analytics/kpis")
def get_kpis(db: Session = Depends(get_db)):
    return analytics.get_dashboard_kpis(db)

@app.get("/api/analytics/bottlenecks")
def get_bottlenecks(db: Session = Depends(get_db)):
    return analytics.get_bottlenecks(db)

@app.get("/api/analytics/hourly-traffic")
def get_hourly_traffic(db: Session = Depends(get_db)):
    return analytics.get_hourly_traffic_trends(db)

# --- REPORTING API ---

@app.get("/api/reports/download")
def download_excel(report_type: str = "operational", db: Session = Depends(get_db)):
    csv_str = reports.generate_excel_csv(db, report_type)
    return StreamingResponse(
        iter([csv_str]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=railflow_report_{report_type}.csv"}
    )

@app.get("/api/reports/print", response_class=HTMLResponse)
def print_report(db: Session = Depends(get_db)):
    return reports.generate_html_print_report(db)

# --- WEBSOCKET ROUTE ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & receive actions
            data = await websocket.receive_json()
            # Handle client-side commands if any
            if data.get("action") == "PING":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
