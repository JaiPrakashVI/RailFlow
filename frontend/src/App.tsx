import React, { useState, useEffect } from 'react';
import { 
  Activity, Train, Building2, Cpu, BrainCircuit, Thermometer, Table, ShieldAlert,
  Sliders, Radio, Bell
} from 'lucide-react';

import ExecutiveDashboard from './views/ExecutiveDashboard';
import OperationsDashboard from './views/OperationsDashboard';
import SimulationDashboard from './views/SimulationDashboard';
import OptimizationDashboard from './views/OptimizationDashboard';
import AIPredictionDashboard from './views/AIPredictionDashboard';
import CongestionDashboard from './views/CongestionDashboard';
import StationDashboard from './views/StationDashboard';
import TrainDashboard from './views/TrainDashboard';
import ReportsDashboard from './views/ReportsDashboard';
import AdminDashboard from './views/AdminDashboard';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('executive');
  
  // Network and simulation state
  const [stations, setStations] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [trafficTrends, setTrafficTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simMode, setSimMode] = useState('Normal');
  const [simTime, setSimTime] = useState('05:00');

  const [selectedTrainId, setSelectedTrainId] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  
  setSelectedTrain = setSelectedTrainId;
  setSelectedStation = setSelectedStationId;

  // Fetch initial digital twin configuration
  const fetchNetwork = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/network');
      const data = await res.json();
      setStations(data.stations);
      setTracks(data.tracks);
      setTrains(data.trains);
    } catch (e) {
      console.error("Network fetch failed:", e);
    }
  };

  const fetchKpis = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analytics/kpis');
      const data = await res.json();
      setKpis(data);
    } catch (e) {
      console.error("KPIs fetch failed:", e);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analytics/hourly-traffic');
      const data = await res.json();
      setTrafficTrends(data);
    } catch (e) {
      console.error("Trends fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchNetwork();
    fetchKpis();
    fetchTrends();
  }, []);

  // Set up WebSocket connection for real-time telemetry streaming
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'SIM_TICK') {
        setSimTime(data.time);
        setSimSpeed(data.speed);
        setSimMode(data.mode);
        // Map live moving coordinates
        setTrains(data.trains);
        // Poll KPIs during ticks to update gauges
        fetchKpis();
      } else if (data.type === 'ALERT') {
        const newAlert = {
          type: 'Incident',
          severity: data.severity,
          message: data.message,
          timestamp: new Date().toISOString()
        };
        setAlerts(prev => [newAlert, ...prev]);
        
        // Add transient toast popup
        const toastId = Math.random();
        setToasts(prev => [...prev, { id: toastId, ...newAlert }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket stream disconnected, attempting reconnection...");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Interactive controls triggers
  const handlePlayPause = async () => {
    const endpoint = isRunning ? 'pause' : 'start';
    try {
      await fetch(`http://localhost:8000/api/simulation/${endpoint}`, { method: 'POST' });
      setIsRunning(!isRunning);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('http://localhost:8000/api/simulation/reset', { method: 'POST' });
      setIsRunning(false);
      setSimTime('05:00');
      fetchNetwork();
      fetchKpis();
      setAlerts([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeSpeed = async (speed: number) => {
    try {
      await fetch(`http://localhost:8000/api/simulation/speed?speed=${speed}`, { method: 'POST' });
      setSimSpeed(speed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeMode = async (mode: string) => {
    try {
      await fetch(`http://localhost:8000/api/simulation/mode?mode=${mode}`, { method: 'POST' });
      setSimMode(mode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerEmergency = async (type: string, detail: string) => {
    try {
      await fetch(`http://localhost:8000/api/simulation/trigger-emergency?type=${type}&detail=${detail}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunOptimization = async () => {
    const res = await fetch('http://localhost:8000/api/optimization/run', { method: 'POST' });
    fetchKpis();
    return await res.json();
  };

  const handleTriggerReroute = async (trainId: string, blockedTrackId: string) => {
    const res = await fetch(`http://localhost:8000/api/optimization/reroute/${trainId}?blocked_track_id=${blockedTrackId}`, { method: 'POST' });
    fetchNetwork();
    return await res.json();
  };

  const handlePredictDelay = async (trainId: string, weather: string, congestion: number, signalDelay: number, maintenance: boolean) => {
    const res = await fetch(`http://localhost:8000/api/prediction/delay?train_id=${trainId}&weather=${weather}&congestion=${congestion}&signal_delay=${signalDelay}&maintenance=${maintenance}`, { method: 'POST' });
    return await res.json();
  };

  const handleGetModelMetrics = async () => {
    const res = await fetch('http://localhost:8000/api/prediction/model-metrics');
    return await res.json();
  };

  const handleGetStationDetails = async (stationId: string) => {
    const res = await fetch(`http://localhost:8000/api/stations/${stationId}`);
    return await res.json();
  };

  const handleGetTrainDetails = async (trainId: string) => {
    const res = await fetch(`http://localhost:8000/api/trains/${trainId}`);
    return await res.json();
  };

  const handleGetBottlenecks = async () => {
    const res = await fetch('http://localhost:8000/api/analytics/bottlenecks');
    return await res.json();
  };

  const handleDownloadCSV = (type: string) => {
    window.open(`http://localhost:8000/api/reports/download?report_type=${type}`, '_blank');
  };

  return (
    <div className="app-container">
      
      {/* Toast Alert popups */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast critical">
            <ShieldAlert size={20} color="var(--clr-crimson)" />
            <div>
              <strong style={{ fontSize: '13px', display: 'block' }}>Operational Alert</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <Radio size={24} color="var(--clr-primary)" className="pulse-animation" />
            <h1 className="sidebar-logo">RailFlow AI</h1>
          </div>
          
          <ul className="sidebar-menu">
            <li className={`sidebar-item ${activeView === 'executive' ? 'active' : ''}`} onClick={() => setActiveView('executive')}>
              <Activity size={18} /> Executive Dashboard
            </li>
            <li className={`sidebar-item ${activeView === 'operations' ? 'active' : ''}`} onClick={() => setActiveView('operations')}>
              <Table size={18} /> Operations Grid
            </li>
            <li className={`sidebar-item ${activeView === 'simulation' ? 'active' : ''}`} onClick={() => setActiveView('simulation')}>
              <Sliders size={18} /> Digital Twin Sim
            </li>
            <li className={`sidebar-item ${activeView === 'optimization' ? 'active' : ''}`} onClick={() => setActiveView('optimization')}>
              <Cpu size={18} /> CP-SAT Optimizer
            </li>
            <li className={`sidebar-item ${activeView === 'predictions' ? 'active' : ''}`} onClick={() => setActiveView('predictions')}>
              <BrainCircuit size={18} /> AI Delay Predictor
            </li>
            <li className={`sidebar-item ${activeView === 'congestion' ? 'active' : ''}`} onClick={() => setActiveView('congestion')}>
              <Thermometer size={18} /> Bottleneck Heatmaps
            </li>
            <li className={`sidebar-item ${activeView === 'stations' ? 'active' : ''}`} onClick={() => setActiveView('stations')}>
              <Building2 size={18} /> Stations Twin
            </li>
            <li className={`sidebar-item ${activeView === 'trains' ? 'active' : ''}`} onClick={() => setActiveView('trains')}>
              <Train size={18} /> Trains Twin
            </li>
            <li className={`sidebar-item ${activeView === 'reports' ? 'active' : ''}`} onClick={() => setActiveView('reports')}>
              <Bell size={18} /> Report Exporter
            </li>
            <li className={`sidebar-item ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setActiveView('admin')}>
              <ShieldAlert size={18} /> System Portal
            </li>
          </ul>
        </div>
        
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--clr-emerald)' }} />
            <span>Telemetry Link Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Viewport Panel */}
      <main className="main-content">
        <header className="header-bar">
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 600 }}>RailFlow AI Command Console</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>System Time: <strong>{simTime}</strong></span>
            <span className="badge info">OPERATOR ROLE</span>
          </div>
        </header>

        <div className="view-container">
          {activeView === 'executive' && (
            <ExecutiveDashboard 
              kpis={kpis} 
              trafficTrends={trafficTrends} 
              activeView={activeView} 
            />
          )}
          {activeView === 'operations' && (
            <OperationsDashboard 
              trains={trains} 
              stations={stations} 
              conflicts={alerts.filter(a => a.type === 'Incident')}
              onSelectTrain={(id) => { setSelectedTrain(id); setActiveView('trains'); }}
              onSelectStation={(id) => { setSelectedStation(id); setActiveView('stations'); }}
            />
          )}
          {activeView === 'simulation' && (
            <SimulationDashboard 
              stations={stations}
              tracks={tracks}
              trains={trains}
              isRunning={isRunning}
              simSpeed={simSpeed}
              simMode={simMode}
              simTime={simTime}
              alerts={alerts}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onChangeSpeed={handleChangeSpeed}
              onChangeMode={handleChangeMode}
              onTriggerEmergency={handleTriggerEmergency}
              onSelectTrain={(id) => { setSelectedTrain(id); setActiveView('trains'); }}
              onSelectStation={(id) => { setSelectedStation(id); setActiveView('stations'); }}
            />
          )}
          {activeView === 'optimization' && (
            <OptimizationDashboard 
              onRunOptimization={handleRunOptimization}
              optResults={kpis}
              isLoading={false}
            />
          )}
          {activeView === 'predictions' && (
            <AIPredictionDashboard 
              trains={trains}
              onPredictDelay={handlePredictDelay}
              onGetModelMetrics={handleGetModelMetrics}
            />
          )}
          {activeView === 'congestion' && (
            <CongestionDashboard 
              stations={stations}
              tracks={tracks}
              trains={trains}
              onGetBottlenecks={handleGetBottlenecks}
            />
          )}
          {activeView === 'stations' && (
            <StationDashboard 
              stations={stations}
              selectedStationId={selectedStationId}
              onGetStationDetails={handleGetStationDetails}
            />
          )}
          {activeView === 'trains' && (
            <TrainDashboard 
              trains={trains}
              tracks={tracks}
              selectedTrainId={selectedTrainId}
              onGetTrainDetails={handleGetTrainDetails}
              onTriggerReroute={handleTriggerReroute}
            />
          )}
          {activeView === 'reports' && (
            <ReportsDashboard 
              onDownloadCSV={handleDownloadCSV}
            />
          )}
          {activeView === 'admin' && (
            <AdminDashboard 
              onTriggerEmergency={handleTriggerEmergency}
            />
          )}
        </div>
      </main>

    </div>
  );
};

// State hooks placeholders to connect sub-views transition selection
let setSelectedTrain = (_id: string) => {};
let setSelectedStation = (_id: string) => {};

export default App;
