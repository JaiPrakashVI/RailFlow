import unittest
import os
import sys

# Add root project path to import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.simulation.network import RailwayNetwork
from backend.simulation.simulator import RailwaySimulator
from backend.optimization.optimizer import RailwayOptimizer
from backend.ml.delay_predictor import DelayPredictor
from backend.app.database import init_db, SessionLocal, Train, Track, Station

class TestRailFlowBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure local SQLite testing file
        os.environ["DATABASE_URL"] = "sqlite:///./test_railflow.db"
        init_db()
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        # Clean up testing database
        if os.path.exists("./test_railflow.db"):
            try:
                os.remove("./test_railflow.db")
            except Exception:
                pass

    def test_01_network_topology(self):
        """Verify network generated has appropriate scale"""
        network = RailwayNetwork()
        self.assertGreaterEqual(len(network.stations), 7, "Stations count should be at least 7")
        self.assertGreaterEqual(len(network.tracks), 6, "Track segments count should be at least 6")

    def test_02_pathfinding(self):
        """Verify Dijkstra shortest path logic resolves valid routes"""
        network = RailwayNetwork()
        path = network.find_shortest_path("S01", "S07") # ChennaiMAS to CoimbatoreCBE
        self.assertIsNotNone(path, "Pathfinder should resolve a route")
        self.assertGreaterEqual(len(path), 3, "Route path should contain at least 3 waypoint nodes")
        self.assertEqual(path[0], "S01", "Path start must match source")
        self.assertEqual(path[-1], "S07", "Path end must match destination")

    def test_03_ml_predictor(self):
        """Verify ML delay predictor makes inference results under features inputs"""
        predictor = DelayPredictor()
        train_spec = {"type": "Superfast Express", "delay": 15, "speed": 110, "distance": 400}
        
        forecast = predictor.predict_delay(
            train=train_spec,
            weather="Clear",
            congestion=0.2,
            signal_delay=5,
            maintenance=False
        )
        
        self.assertIn("predicted_delay", forecast)
        self.assertIn("risk_score", forecast)
        self.assertIn("confidence", forecast)
        self.assertGreaterEqual(forecast["predicted_delay"], 0.0)
        self.assertLessEqual(forecast["risk_score"], 1.0)

    def test_04_schedule_optimizer(self):
        """Verify schedule CP-SAT / heuristic optimization dispatch logs"""
        optimizer = RailwayOptimizer()
        trains = [
            {"id": "T001", "departure": "06:00", "speed": 110, "path": ["S01", "S02", "S03"], "delay": 10},
            {"id": "T002", "departure": "06:05", "speed": 90, "path": ["S01", "S02", "S03"], "delay": 5}
        ]
        tracks = [
            {"id": "TR01", "from": "S01", "to": "S02", "distance": 69, "speed_limit": 110, "single_line": True},
            {"id": "TR02", "from": "S02", "to": "S03", "distance": 65, "speed_limit": 100, "single_line": True}
        ]
        
        result = optimizer.optimize_schedules(trains, tracks)
        self.assertIn("optimized_trains", result)
        self.assertIn("optimized_conflicts", result)
        self.assertIn("conflict_reduction", result)
        self.assertGreaterEqual(result["conflict_reduction"], 0.0)

    def test_05_simulator_step(self):
        """Verify stateful simulator ticking and block occupancy updates"""
        simulator = RailwaySimulator()
        simulator.initialize_simulation(self.db, 50)
        
        # Test simulation step
        simulator.step(self.db, 5.0) # Step by 5 minutes
        self.assertEqual(simulator.sim_time.strftime("%H:%M"), "05:05", "Simulation time should tick forward by 5 minutes")
        
        # Verify trains have updated columns
        active_t = self.db.query(Train).first()
        self.assertIsNotNone(active_t)
        self.assertIn(active_t.status, ["Scheduled", "Running", "AtStation", "Halted"])

if __name__ == '__main__':
    unittest.main()
