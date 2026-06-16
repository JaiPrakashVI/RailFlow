import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./railflow.db")

# For SQLite, enable same-thread queries for simplicity in dev/testing
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    role = Column(String(20), default="viewer") # admin, operator, viewer
    created_at = Column(DateTime, default=datetime.utcnow)

class Station(Base):
    __tablename__ = "stations"
    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), nullable=False, unique=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    platforms_count = Column(Integer, nullable=False)

class Track(Base):
    __tablename__ = "tracks"
    id = Column(String(10), primary_key=True)
    from_station_id = Column(String(10), ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(String(10), ForeignKey("stations.id"), nullable=False)
    distance = Column(Float, nullable=False)
    speed_limit = Column(Integer, nullable=False)
    single_line = Column(Boolean, default=False)
    status = Column(String(20), default="Active") # Active, Maintenance, Blocked

class Signal(Base):
    __tablename__ = "signals"
    id = Column(String(10), primary_key=True)
    track_id = Column(String(10), ForeignKey("tracks.id"), nullable=False)
    position = Column(String(50), nullable=False) # e.g. "S01_Entry", "S02_Exit", "TR01_Block_1"
    state = Column(String(20), default="Green") # Red, Yellow, Double Yellow, Green

class Train(Base):
    __tablename__ = "trains"
    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # Express, Superfast, etc.
    source = Column(String(10), ForeignKey("stations.id"), nullable=False)
    destination = Column(String(10), ForeignKey("stations.id"), nullable=False)
    speed = Column(Integer, nullable=False)
    status = Column(String(30), default="On Time") # On Time, Delayed, Halted, Cancelled
    delay = Column(Integer, default=0) # current delay in minutes
    weather = Column(String(30), default="Clear")
    track_congestion = Column(Float, default=0.2)
    platform = Column(Integer, default=1)
    current_speed = Column(Float, default=0.0)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(10), ForeignKey("trains.id"), nullable=False)
    station_id = Column(String(10), ForeignKey("stations.id"), nullable=False)
    scheduled_arrival = Column(String(10), nullable=True) # "HH:MM"
    scheduled_departure = Column(String(10), nullable=True)
    actual_arrival = Column(String(10), nullable=True)
    actual_departure = Column(String(10), nullable=True)

class Conflict(Base):
    __tablename__ = "conflicts"
    id = Column(String(10), primary_key=True)
    type = Column(String(30), nullable=False) # Track, Platform, Signal, Crossing, Overtaking, SingleLine
    train_a = Column(String(10), ForeignKey("trains.id"), nullable=False)
    train_b = Column(String(10), ForeignKey("trains.id"), nullable=True)
    track = Column(String(10), ForeignKey("tracks.id"), nullable=True)
    station = Column(String(10), ForeignKey("stations.id"), nullable=True)
    time = Column(String(10), nullable=False) # "HH:MM"
    severity = Column(String(20), nullable=False) # Low, Medium, High, Critical
    root_cause = Column(Text, nullable=True)
    impact_analysis = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(10), ForeignKey("trains.id"), nullable=False)
    predicted_delay = Column(Float, nullable=False)
    actual_delay = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=False) # 0 to 1
    confidence = Column(Float, nullable=False) # 0 to 1
    timestamp = Column(DateTime, default=datetime.utcnow)

class OptimizationRun(Base):
    __tablename__ = "optimizations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    method = Column(String(50), nullable=False) # OR-Tools CP-SAT, Heuristic
    conflicts_before = Column(Integer, nullable=False)
    conflicts_after = Column(Integer, nullable=False)
    delay_before = Column(Float, nullable=False)
    delay_after = Column(Float, nullable=False)
    track_utilization = Column(Float, nullable=False)
    platform_efficiency = Column(Float, nullable=False)
    trains_rescheduled = Column(Integer, nullable=False)
    cost_savings = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(30), nullable=False) # Congestion, Conflict, Emergency, SignalFailure, Delay
    severity = Column(String(20), nullable=False) # Info, Warning, Critical
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

# --- Helper functions ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed stations and tracks if empty
    db = SessionLocal()
    try:
        if db.query(Station).count() == 0:
            from backend.simulation.network import STATIONS as network_stations, TRACKS as network_tracks
            
            # Seed Stations
            for s in network_stations:
                station = Station(
                    id=s["id"],
                    name=s["name"],
                    code=s["code"],
                    lat=s["lat"],
                    lng=s["lng"],
                    platforms_count=s["platforms"]
                )
                db.add(station)
            
            # Seed Tracks
            for t in network_tracks:
                track = Track(
                    id=t["id"],
                    from_station_id=t["from"],
                    to_station_id=t["to"],
                    distance=t["distance"],
                    speed_limit=t["speed_limit"],
                    single_line=t["single_line"],
                    status=t["status"]
                )
                db.add(track)
                
                # Create default signals for each track
                # Entry signal for from station
                db.add(Signal(id=f"SG_{t['id']}_1", track_id=t["id"], position=f"{t['from']}_Exit", state="Green"))
                # Entry signal for to station
                db.add(Signal(id=f"SG_{t['id']}_2", track_id=t["id"], position=f"{t['to']}_Exit", state="Green"))
                
            db.commit()
            print("Database initialized and seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
