import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from backend.simulation.network import RailwayNetwork, STATIONS, TRACKS
from backend.app.database import Station, Track, Signal, Train, Schedule, Conflict, Alert, SessionLocal
from backend.app.websocket import manager
import asyncio

WEATHER_CONDITIONS = ["Clear", "Cloudy", "Rainy", "Foggy", "Stormy"]
TRAIN_TYPES = [
    {"type": "Rajdhani Express", "speed": 130, "priority": 1, "occupancy_range": (300, 600)},
    {"type": "Superfast Express", "speed": 110, "priority": 2, "occupancy_range": (500, 1000)},
    {"type": "Shatabdi Express", "speed": 120, "priority": 1, "occupancy_range": (300, 500)},
    {"type": "Mail Express", "speed": 90, "priority": 3, "occupancy_range": (600, 1200)},
    {"type": "Intercity Express", "speed": 100, "priority": 2, "occupancy_range": (400, 800)},
    {"type": "Passenger Train", "speed": 60, "priority": 4, "occupancy_range": (800, 1500)},
]

class RailwaySimulator:
    def __init__(self):
        self.network = RailwayNetwork()
        self.is_running = False
        self.sim_speed = 1.0
        self.sim_mode = "Normal"
        self.sim_time = datetime.strptime("05:00", "%H:%M")
        self.active_trains: Dict[str, dict] = {}
        self.conflict_logs: List[dict] = []
        self.alert_logs: List[dict] = []
        self.last_run_results = None

    def initialize_simulation(self, db: Session, train_count: int = 100):
        """Reset and seed simulation data in the database"""
        db.query(Train).delete()
        db.query(Schedule).delete()
        db.query(Conflict).delete()
        db.query(Alert).delete()
        db.commit()

        train_types = TRAIN_TYPES
        station_ids = [s["id"] for s in self.network.stations]
        base_time = datetime.strptime("05:00", "%H:%M")
        
        for i in range(train_count):
            t_info = random.choice(train_types)
            src, dst = random.sample(station_ids, 2)
            path = self.network.find_shortest_path(src, dst)
            while not path or len(path) < 3:
                src, dst = random.sample(station_ids, 2)
                path = self.network.find_shortest_path(src, dst)
                
            dep_offset = random.randint(0, 720)
            dep_time = base_time + timedelta(minutes=dep_offset)
            
            train_id = f"T{i+1:03d}"
            train_name = f"{t_info['type'].split()[0]} {random.randint(12000, 12999)}"
            
            weather = random.choice(WEATHER_CONDITIONS)
            if self.sim_mode == "Emergency":
                weather = random.choice(["Rainy", "Stormy", "Foggy"])
                
            t_obj = Train(
                id=train_id,
                name=train_name,
                type=t_info['type'],
                source=src,
                destination=dst,
                speed=t_info['speed'],
                status="On Time",
                delay=0,
                weather=weather,
                track_congestion=round(random.uniform(0.1, 0.4), 2),
                platform=random.randint(1, min(self.network.get_station_by_id(src)["platforms"], 3)),
                current_speed=0.0,
                current_lat=self.network.get_station_by_id(src)["lat"],
                current_lng=self.network.get_station_by_id(src)["lng"]
            )
            db.add(t_obj)
            
            current_station_time = dep_time
            
            for path_idx, station_id in enumerate(path):
                if path_idx == 0:
                    sched_arr = None
                    sched_dep = current_station_time.strftime("%H:%M")
                    dwell = 15
                    current_station_time += timedelta(minutes=dwell)
                elif path_idx == len(path) - 1:
                    prev_station = path[path_idx - 1]
                    dist = self._get_track_distance(prev_station, station_id)
                    travel_time_mins = int((dist / t_info['speed']) * 60)
                    current_station_time += timedelta(minutes=travel_time_mins)
                    
                    sched_arr = current_station_time.strftime("%H:%M")
                    sched_dep = None
                else:
                    prev_station = path[path_idx - 1]
                    dist = self._get_track_distance(prev_station, station_id)
                    travel_time_mins = int((dist / t_info['speed']) * 60)
                    current_station_time += timedelta(minutes=travel_time_mins)
                    
                    sched_arr = current_station_time.strftime("%H:%M")
                    dwell = random.choice([2, 5, 8])
                    if self.sim_mode == "Festival Traffic":
                        dwell += 5
                    current_station_time += timedelta(minutes=dwell)
                    sched_dep = current_station_time.strftime("%H:%M")

                sched_entry = Schedule(
                    train_id=train_id,
                    station_id=station_id,
                    scheduled_arrival=sched_arr,
                    scheduled_departure=sched_dep,
                    actual_arrival=sched_arr,
                    actual_departure=sched_dep
                )
                db.add(sched_entry)
                
            self.active_trains[train_id] = {
                "id": train_id,
                "name": train_name,
                "type": t_info['type'],
                "priority": t_info['priority'],
                "source": src,
                "destination": dst,
                "speed": t_info['speed'],
                "path": path,
                "current_path_index": 0,
                "current_track_id": None,
                "current_block_index": 0,
                "distance_on_track": 0.0,
                "status": "Scheduled",
                "delay": 0,
                "weather": t_obj.weather,
                "platform": t_obj.platform,
                "time_at_station": 0,
                "scheduled_departure": dep_time,
                "current_time": dep_time,
                "lat": t_obj.current_lat,
                "lng": t_obj.current_lng
            }
            
        db.commit()

    def _get_track_distance(self, s1: str, s2: str) -> float:
        for t in self.network.tracks:
            if (t["from"] == s1 and t["to"] == s2) or (t["to"] == s1 and t["from"] == s2):
                return t["distance"]
        return 50.0

    def _get_track_by_stations(self, s1: str, s2: str) -> Optional[dict]:
        return next((t for t in self.network.tracks if (t["from"] == s1 and t["to"] == s2) or (t["to"] == s1 and t["from"] == s2)), None)

    def step(self, db: Session, minutes_elapsed: float = 1.0):
        """Tick the simulation forward by `minutes_elapsed` minutes"""
        self.sim_time += timedelta(minutes=minutes_elapsed)
        current_time_str = self.sim_time.strftime("%H:%M")
        
        # Track occupancy maps to support dynamic signal blocks and conflict checks
        track_blocks = {}
        for t in self.network.tracks:
            track_blocks[t["id"]] = [None, None, None]

        station_platforms = {s["id"]: {} for s in self.network.stations}

        # PASS 1: Determine train locations & populate occupancy grids
        for t_id, train in self.active_trains.items():
            path = train["path"]
            idx = train["current_path_index"]
            status = train["status"]
            
            if status == "Scheduled":
                dep_time = train["scheduled_departure"] + timedelta(minutes=train["delay"])
                if self.sim_time >= dep_time:
                    next_station = path[1]
                    track = self._get_track_by_stations(path[0], next_station)
                    if track and track_blocks[track["id"]][0] is None:
                        train["status"] = "Running"
                        train["current_track_id"] = track["id"]
                        train["current_block_index"] = 0
                        train["distance_on_track"] = 0.0
                        track_blocks[track["id"]][0] = t_id
                    else:
                        train["status"] = "Halted"
                        train["time_at_station"] += minutes_elapsed
                        train["delay"] += minutes_elapsed
                        station_platforms[path[0]][train["platform"]] = t_id
            elif status == "AtStation":
                dwell_limit = 5
                if train["current_path_index"] == 0:
                    dwell_limit = 15
                elif train["current_path_index"] == len(path) - 1:
                    dwell_limit = 99999
                    
                if train["time_at_station"] >= dwell_limit:
                    next_idx = idx + 1
                    if next_idx < len(path):
                        next_station = path[next_idx]
                        track = self._get_track_by_stations(path[idx], next_station)
                        if track and track_blocks[track["id"]][0] is None:
                            train["status"] = "Running"
                            train["current_track_id"] = track["id"]
                            train["current_block_index"] = 0
                            train["distance_on_track"] = 0.0
                            train["time_at_station"] = 0
                            track_blocks[track["id"]][0] = t_id
                        else:
                            train["time_at_station"] += minutes_elapsed
                            train["delay"] += minutes_elapsed
                            station_platforms[path[idx]][train["platform"]] = t_id
                else:
                    train["time_at_station"] += minutes_elapsed
                    station_platforms[path[idx]][train["platform"]] = t_id
            elif status == "Running":
                track_id = train["current_track_id"]
                block_idx = train["current_block_index"]
                track_blocks[track_id][block_idx] = t_id

        # PASS 2: Update block signals based on occupancy (4-Aspect Signals)
        for track in self.network.tracks:
            t_id_blocks = track_blocks[track["id"]]
            signals = db.query(Signal).filter(Signal.track_id == track["id"]).all()
            for sig in signals:
                if t_id_blocks[0] is not None:
                    sig.state = "Red"
                elif t_id_blocks[1] is not None:
                    sig.state = "Yellow"
                elif t_id_blocks[2] is not None:
                    sig.state = "Double Yellow"
                else:
                    sig.state = "Green"

        # PASS 3: Move running trains & perform conflict checks
        for t_id, train in self.active_trains.items():
            if train["status"] != "Running":
                continue
                
            path = train["path"]
            idx = train["current_path_index"]
            track_id = train["current_track_id"]
            block_idx = train["current_block_index"]
            dist_on_track = train["distance_on_track"]
            
            track_obj = self._get_track_by_stations(path[idx], path[idx+1])
            if not track_obj:
                continue
                
            speed = train["speed"]
            
            if train["weather"] in ["Rainy", "Foggy"]:
                speed *= 0.8
            elif train["weather"] == "Stormy":
                speed *= 0.6
                
            if self.sim_mode == "Emergency":
                speed *= 0.7
                
            if block_idx < 2:
                next_block_occupant = track_blocks[track_id][block_idx + 1]
                if next_block_occupant is not None:
                    speed = min(speed, 30.0)
            
            distance_elapsed = (speed / 60.0) * minutes_elapsed
            new_dist = dist_on_track + distance_elapsed
            total_dist = track_obj["distance"]
            
            block_length = total_dist / 3.0
            new_block_idx = min(int(new_dist / block_length), 2)
            
            if new_block_idx != block_idx:
                occupant = track_blocks[track_id][new_block_idx]
                if occupant is not None and occupant != t_id:
                    train["status"] = "Halted"
                    train["delay"] += minutes_elapsed
                    self._log_conflict(
                        db, "Track Segment Overlap", t_id, occupant, track_id=track_id, 
                        desc=f"Train {t_id} tailgating {occupant} on track {track_id} block {new_block_idx}"
                    )
                    continue
                else:
                    track_blocks[track_id][block_idx] = None
                    track_blocks[track_id][new_block_idx] = t_id
                    train["current_block_index"] = new_block_idx

            st_from = self.network.get_station_by_id(path[idx])
            st_to = self.network.get_station_by_id(path[idx+1])
            frac = min(new_dist / total_dist, 1.0)
            train["lat"] = st_from["lat"] + frac * (st_to["lat"] - st_from["lat"])
            train["lng"] = st_from["lng"] + frac * (st_to["lng"] - st_from["lng"])
            train["distance_on_track"] = new_dist
            
            if new_dist >= total_dist:
                train["current_path_index"] += 1
                new_idx = train["current_path_index"]
                dest_station_id = path[new_idx]
                dest_station = self.network.get_station_by_id(dest_station_id)
                
                assigned_platform = random.randint(1, dest_station["platforms"])
                
                other_train_on_pf = station_platforms[dest_station_id].get(assigned_platform)
                if other_train_on_pf is not None:
                    train["status"] = "Halted"
                    train["delay"] += 5
                    self._log_conflict(
                        db, "Platform Allocation Clash", t_id, other_train_on_pf, station_id=dest_station_id,
                        desc=f"Platform {assigned_platform} occupied by {other_train_on_pf} at {dest_station['name']}"
                    )
                    for pf in range(1, dest_station["platforms"] + 1):
                        if pf not in station_platforms[dest_station_id]:
                            assigned_platform = pf
                            train["status"] = "AtStation"
                            break
                else:
                    train["status"] = "AtStation"
                    
                train["platform"] = assigned_platform
                train["current_track_id"] = None
                train["current_block_index"] = 0
                train["distance_on_track"] = 0.0
                train["time_at_station"] = 0
                train["lat"] = dest_station["lat"]
                train["lng"] = dest_station["lng"]
                track_blocks[track_id][2] = None
                
                sched_record = db.query(Schedule).filter(Schedule.train_id == t_id, Schedule.station_id == dest_station_id).first()
                if sched_record:
                    sched_record.actual_arrival = current_time_str
                
                if new_idx == len(path) - 1:
                    train["status"] = "Completed"
                    train["lat"] = dest_station["lat"]
                    train["lng"] = dest_station["lng"]
                    
        # Check single-line track conflicts (opposite directions)
        for track in self.network.tracks:
            if track["single_line"]:
                occupants = [t_val for t_val in self.active_trains.values() if t_val["current_track_id"] == track["id"]]
                if len(occupants) > 1:
                    dirs = {}
                    for occ in occupants:
                        p = occ["path"]
                        curr_i = occ["current_path_index"]
                        direction = (p[curr_i], p[curr_i+1])
                        dirs[occ["id"]] = direction
                    
                    keys = list(dirs.keys())
                    for idx_a in range(len(keys)):
                        for idx_b in range(idx_a + 1, len(keys)):
                            dir_a = dirs[keys[idx_a]]
                            dir_b = dirs[keys[idx_b]]
                            if dir_a != dir_b and (dir_a[0] == dir_b[1] and dir_a[1] == dir_b[0]):
                                self._log_conflict(
                                    db, "Single Line Head-on Conflict", keys[idx_a], keys[idx_b], track_id=track["id"],
                                    desc=f"Head-on collision danger: {keys[idx_a]} and {keys[idx_b]} on single line {track['id']}"
                                )

        # PASS 4: Persist changes to database & broadcast updates
        for t_id, train in self.active_trains.items():
            db_train = db.query(Train).filter(Train.id == t_id).first()
            if db_train:
                db_train.status = train["status"]
                db_train.delay = int(train["delay"])
                db_train.platform = train["platform"]
                db_train.current_lat = train["lat"]
                db_train.current_lng = train["lng"]
                db_train.current_speed = train["speed"] if train["status"] == "Running" else 0.0
                
        db.commit()

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._broadcast_state(current_time_str))
        except RuntimeError:
            pass

    def _log_conflict(self, db: Session, c_type: str, train_a: str, train_b: Optional[str], 
                      track_id: Optional[str] = None, station_id: Optional[str] = None, desc: str = ""):
        c_id = f"C{db.query(Conflict).count() + 1:04d}"
        
        severity = "Medium"
        if "Head-on" in c_type or "collision" in desc.lower():
            severity = "Critical"
        elif "Overlap" in c_type:
            severity = "High"
            
        root_cause = desc
        impact_analysis = "Potential collision or lockup. Adding delay cascading to surrounding lines."
        resolution = "Hold train A at previous station, reassign platform, or reroute via dynamic route planner."
        
        conflict_obj = Conflict(
            id=c_id,
            type=c_type,
            train_a=train_a,
            train_b=train_b,
            track=track_id,
            station=station_id,
            time=self.sim_time.strftime("%H:%M"),
            severity=severity,
            root_cause=root_cause,
            impact_analysis=impact_analysis,
            resolution=resolution,
            resolved=False
        )
        db.add(conflict_obj)
        
        alert_obj = Alert(
            type="Conflict",
            severity="Critical" if severity in ["Critical", "High"] else "Warning",
            message=f"CONFLICT DETECTED: {c_type} involving {train_a} and {train_b or 'N/A'}. Details: {desc}"
        )
        db.add(alert_obj)
        db.commit()

    async def _broadcast_state(self, current_time: str):
        trains_payload = []
        for t_id, t in self.active_trains.items():
            trains_payload.append({
                "id": t["id"],
                "name": t["name"],
                "type": t["type"],
                "status": t["status"],
                "delay": t["delay"],
                "lat": t["lat"],
                "lng": t["lng"],
                "speed": t["speed"] if t["status"] == "Running" else 0,
                "platform": t["platform"],
                "source": t["source"],
                "destination": t["destination"]
            })
            
        await manager.broadcast({
            "type": "SIM_TICK",
            "time": current_time,
            "mode": self.sim_mode,
            "speed": self.sim_speed,
            "trains": trains_payload
        })

    def run_batch_simulation(self, db: Session, mode: str = "Normal") -> dict:
        """Run a full 24-hour simulation from 05:00 to 23:00 batch-wise and save results"""
        self.sim_mode = mode
        self.initialize_simulation(db, 100)
        
        start_t = datetime.strptime("05:00", "%H:%M")
        end_t = datetime.strptime("23:00", "%H:%M")
        
        curr_t = start_t
        while curr_t < end_t:
            self.step(db, 2.0)
            curr_t += timedelta(minutes=2)
            
        total_trains = len(self.active_trains)
        total_delays = sum(t["delay"] for t in self.active_trains.values())
        conflict_count = db.query(Conflict).count()
        avg_delay = round(total_delays / max(total_trains, 1), 1)
        
        track_util = min(92.0, 52.0 + (conflict_count * 0.25))
        platform_eff = max(45.0, 85.0 - (conflict_count * 0.4))
        
        self.last_run_results = {
            "mode": mode,
            "total_trains": total_trains,
            "conflicts": conflict_count,
            "avg_delay": avg_delay,
            "track_utilization": round(track_util, 1),
            "platform_efficiency": round(platform_eff, 1)
        }
        return self.last_run_results
