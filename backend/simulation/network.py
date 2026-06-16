import random
import os
import json
from typing import List, Dict, Optional, Tuple

# Set seed for deterministic network generation matching scale requirements
random.seed(42)

# Initial core stations (20 stations)
CORE_STATIONS = [
    {"id": "S01", "name": "Chennai Central", "code": "MAS", "lat": 13.0827, "lng": 80.2707, "platforms": 12},
    {"id": "S02", "name": "Arakkonam Jn", "code": "AJJ", "lat": 13.0837, "lng": 79.6697, "platforms": 6},
    {"id": "S03", "name": "Katpadi Jn", "code": "KPD", "lat": 12.9202, "lng": 79.1329, "platforms": 5},
    {"id": "S04", "name": "Jolarpettai Jn", "code": "JTJ", "lat": 12.5685, "lng": 78.5777, "platforms": 4},
    {"id": "S05", "name": "Salem Jn", "code": "SA", "lat": 11.6643, "lng": 78.1460, "platforms": 6},
    {"id": "S06", "name": "Erode Jn", "code": "ED", "lat": 11.3428, "lng": 77.7274, "platforms": 5},
    {"id": "S07", "name": "Coimbatore Jn", "code": "CBE", "lat": 11.0168, "lng": 76.9558, "platforms": 8},
    {"id": "S08", "name": "Tiruppur", "code": "TUP", "lat": 11.1085, "lng": 77.3411, "platforms": 4},
    {"id": "S09", "name": "Madurai Jn", "code": "MDU", "lat": 9.9252, "lng": 78.1198, "platforms": 7},
    {"id": "S10", "name": "Tiruchirappalli Jn", "code": "TPJ", "lat": 10.7905, "lng": 78.7047, "platforms": 8},
    {"id": "S11", "name": "Vellore Cantt", "code": "VLR", "lat": 12.9165, "lng": 79.1325, "platforms": 3},
    {"id": "S12", "name": "Tambaram", "code": "TBM", "lat": 12.9249, "lng": 80.1000, "platforms": 4},
    {"id": "S13", "name": "Chengalpattu Jn", "code": "CGL", "lat": 12.6924, "lng": 79.9762, "platforms": 4},
    {"id": "S14", "name": "Villupuram Jn", "code": "VM", "lat": 11.9385, "lng": 79.4921, "platforms": 5},
    {"id": "S15", "name": "Cuddalore Port", "code": "CUPJ", "lat": 11.7447, "lng": 79.7680, "platforms": 3},
    {"id": "S16", "name": "Nagapattinam Jn", "code": "NGT", "lat": 10.7672, "lng": 79.8449, "platforms": 3},
    {"id": "S17", "name": "Dindigul Jn", "code": "DG", "lat": 10.3624, "lng": 77.9695, "platforms": 4},
    {"id": "S18", "name": "Tirunelveli Jn", "code": "TEN", "lat": 8.7139, "lng": 77.7567, "platforms": 5},
    {"id": "S19", "name": "Nagercoil Jn", "code": "NCJ", "lat": 8.1833, "lng": 77.4119, "platforms": 4},
    {"id": "S20", "name": "Karur Jn", "code": "KRR", "lat": 10.9601, "lng": 78.0766, "platforms": 3},
]

# Additional stations to meet the 50+ stations requirement (32 more stations)
ADDITIONAL_STATION_NAMES = [
    ("Bangalore City", "SBC", 12.9716, 77.5946, 10),
    ("Mysore Jn", "MYS", 12.3118, 76.6529, 6),
    ("Hosur", "HSRA", 12.7409, 77.8253, 3),
    ("Dharmapuri", "DPJ", 12.1332, 78.1585, 3),
    ("Namakkal", "NMKL", 11.2189, 78.1672, 3),
    ("Puducherry", "PDY", 11.9338, 79.8298, 3),
    ("Thanjavur Jn", "TJ", 10.7828, 79.1318, 5),
    ("Kumbakonam", "KMU", 10.9598, 79.3881, 3),
    ("Mayiladuthurai Jn", "MV", 11.1018, 79.6520, 4),
    ("Karaikudi Jn", "KKDI", 10.0734, 78.7844, 4),
    ("Rameswaram", "RMM", 9.2881, 79.3121, 4),
    ("Tuticorin", "TN", 8.8105, 78.1448, 3),
    ("Tenkasi Jn", "TSI", 8.9594, 77.3142, 3),
    ("Virudhunagar Jn", "VPT", 9.5872, 77.9577, 4),
    ("Rajapalayam", "RJPM", 9.4522, 77.5539, 2),
    ("Shenkottai", "SCT", 8.9806, 77.2514, 3),
    ("Pollachi Jn", "POY", 10.6589, 77.0084, 3),
    ("Palani", "PLNI", 10.4491, 77.5255, 3),
    ("Udhagamandalam", "UAM", 11.4075, 76.6960, 3), # Ooty
    ("Mettupalayam", "MTP", 11.3008, 76.9405, 2),
    ("Tiruvallur", "TRL", 13.1423, 79.9081, 4),
    ("Gummidipoondi", "GPD", 13.4074, 80.1232, 3),
    ("Shoranur Jn", "SRR", 10.7630, 76.2731, 7),
    ("Palakkad Jn", "PGT", 10.7915, 76.6548, 5),
    ("Thrissur", "TCR", 10.5186, 76.2161, 4),
    ("Ernakulam Jn", "ERS", 9.9637, 76.2948, 6),
    ("Alappuzha", "ALLP", 9.4912, 76.3264, 3),
    ("Kottayam", "KTYM", 9.5916, 76.5221, 3),
    ("Kollam Jn", "QLN", 8.8876, 76.5958, 6),
    ("Trivandrum Central", "TVC", 8.4879, 76.9525, 9),
    ("Kanyakumari", "CAPE", 8.0883, 77.5385, 4),
    ("Sankari Durg", "SGE", 11.4795, 77.8682, 2)
]

# Check for custom data files
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STATIONS_FILE = os.path.join(DATA_DIR, "stations.json")
TRACKS_FILE = os.path.join(DATA_DIR, "tracks.json")

STATIONS = []
TRACKS = []

if os.path.exists(STATIONS_FILE) and os.path.exists(TRACKS_FILE):
    try:
        with open(STATIONS_FILE, "r") as f:
            STATIONS = json.load(f)
        with open(TRACKS_FILE, "r") as f:
            custom_tracks = json.load(f)
            TRACKS = []
            for t in custom_tracks:
                TRACKS.append({
                    "id": t["id"],
                    "from": t["from"],
                    "to": t["to"],
                    "distance": t["distance"],
                    "speed_limit": t["speed_limit"],
                    "single_line": t.get("single_line", False),
                    "status": t.get("status", "Active")
                })
        print(f"Successfully loaded custom network: {len(STATIONS)} stations, {len(TRACKS)} tracks.")
    except Exception as e:
        print(f"Error loading custom network files: {e}. Falling back to default generation.")
        STATIONS = []
        TRACKS = []

if not STATIONS or not TRACKS:
    # Default fallback generation
    STATIONS = list(CORE_STATIONS)
    for i, name_tuple in enumerate(ADDITIONAL_STATION_NAMES):
        s_id = f"S{21 + i:02d}"
        STATIONS.append({
            "id": s_id,
            "name": name_tuple[0],
            "code": name_tuple[1],
            "lat": name_tuple[2],
            "lng": name_tuple[3],
            "platforms": name_tuple[4]
        })

    TRACKS = []
    track_counter = 1

    # Add core tracks first
    for ct in CORE_TRACKS:
        TRACKS.append({
            "id": f"TR{track_counter:03d}",
            "from": ct["from"],
            "to": ct["to"],
            "distance": ct["dist"],
            "speed_limit": ct["speed"],
            "single_line": ct["single"],
            "status": "Active"
        })
        track_counter += 1

    # Helper to check if a track segment already exists
    def track_exists(s1, s2):
        return any(
            (t["from"] == s1 and t["to"] == s2) or (t["from"] == s2 and t["to"] == s1)
            for t in TRACKS
        )

    # Let's dynamically add realistic tracks based on geographical distance
    for s1 in STATIONS:
        distances = []
        for s2 in STATIONS:
            if s1["id"] == s2["id"]:
                continue
            dist = compute_distance(s1["lat"], s1["lng"], s2["lat"], s2["lng"])
            distances.append((dist, s2["id"]))
        
        # Sort by distance
        distances.sort()
        
        # Connect to 4 nearest neighbors if not already connected
        for d, s2_id in distances[:4]:
            if d < 180 and not track_exists(s1["id"], s2_id):
                speed = random.choice([80, 90, 100, 110, 120])
                single = random.choice([True, False, False]) # 1/3 single line, 2/3 double line
                
                TRACKS.append({
                    "id": f"TR{track_counter:03d}",
                    "from": s1["id"],
                    "to": s2_id,
                    "distance": max(d, 5), # min 5km
                    "speed_limit": speed,
                    "single_line": single,
                    "status": "Active"
                })
                track_counter += 1

    # Add remaining links to make sure the network is strongly connected and exceeds 200 track segments
    while len(TRACKS) < 205:
        s1 = random.choice(STATIONS)
        s2 = random.choice(STATIONS)
        if s1["id"] != s2["id"] and not track_exists(s1["id"], s2["id"]):
            d = compute_distance(s1["lat"], s1["lng"], s2["lat"], s2["lng"])
            if d < 250:
                speed = random.choice([70, 80, 90, 100])
                single = random.choice([True, True, False])
                TRACKS.append({
                    "id": f"TR{track_counter:03d}",
                    "from": s1["id"],
                    "to": s2_id,
                    "distance": max(d, 5),
                    "speed_limit": speed,
                    "single_line": single,
                    "status": "Active"
                })
                track_counter += 1


# Verify sizes:
# print(f"Generated {len(STATIONS)} stations and {len(TRACKS)} tracks.")

def build_adjacency_dict() -> Dict[str, List[Tuple[str, int, str]]]:
    """Returns adjacency list representation of the network: station_id -> list of (to_station_id, distance, track_id)"""
    graph = {s["id"]: [] for s in STATIONS}
    for track in TRACKS:
        # If track is not blocked
        if track["status"] == "Active":
            graph[track["from"]].append((track["to"], track["distance"], track["id"]))
            graph[track["to"]].append((track["from"], track["distance"], track["id"]))
    return graph

class RailwayNetwork:
    def __init__(self):
        self.stations = STATIONS
        self.tracks = TRACKS
        self.adjacency = build_adjacency_dict()

    def update_track_status(self, track_id: str, status: str):
        """Set track status: Active, Maintenance, Blocked"""
        for t in self.tracks:
            if t["id"] == track_id:
                t["status"] = status
                break
        self.adjacency = build_adjacency_dict()

    def get_station_by_id(self, s_id: str) -> Optional[dict]:
        return next((s for s in self.stations if s["id"] == s_id), None)

    def find_shortest_path(self, start_id: str, end_id: str) -> Optional[List[str]]:
        """Dijkstra algorithm to find the shortest path by distance"""
        if start_id == end_id:
            return [start_id]
            
        distances = {s["id"]: float('inf') for s in self.stations}
        previous = {s["id"]: None for s in self.stations}
        distances[start_id] = 0
        nodes = list(distances.keys())
        
        while nodes:
            # Get node with min distance
            current = min(nodes, key=lambda n: distances[n])
            nodes.remove(current)
            
            if distances[current] == float('inf') or current == end_id:
                break
                
            for neighbor, dist, track_id in self.adjacency.get(current, []):
                # Penalty for single track, maintenance, or high distance
                weight = dist
                alt = distances[current] + weight
                if alt < distances[neighbor]:
                    distances[neighbor] = alt
                    previous[neighbor] = current
                    
        # Reconstruct path
        path = []
        curr = end_id
        while curr is not None:
            path.append(curr)
            curr = previous[curr]
            
        path.reverse()
        return path if path[0] == start_id else None
