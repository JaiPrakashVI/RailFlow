import React from 'react';
import LiveMap from '../components/LiveMap';
import ControlPanel from '../components/ControlPanel';
import { Terminal } from 'lucide-react';

interface SimulationDashboardProps {
  stations: any[];
  tracks: any[];
  trains: any[];
  isRunning: boolean;
  simSpeed: number;
  simMode: string;
  simTime: string;
  alerts: any[];
  onPlayPause: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onChangeMode: (mode: string) => void;
  onTriggerEmergency: (type: string, detail: string) => void;
  onSelectTrain: (id: string) => void;
  onSelectStation: (id: string) => void;
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({
  stations,
  tracks,
  trains,
  isRunning,
  simSpeed,
  simMode,
  simTime,
  alerts,
  onPlayPause,
  onReset,
  onChangeSpeed,
  onChangeMode,
  onTriggerEmergency,
  onSelectTrain,
  onSelectStation
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Railway Digital Twin Simulation</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Stateful mathematical modeling of block sections, 4-aspect signal controls, and platform dwells.
        </p>
      </div>

      {/* Control Panel Widget */}
      <ControlPanel 
        isRunning={isRunning}
        simSpeed={simSpeed}
        simMode={simMode}
        simTime={simTime}
        onPlayPause={onPlayPause}
        onReset={onReset}
        onChangeSpeed={onChangeSpeed}
        onChangeMode={onChangeMode}
        onTriggerEmergency={onTriggerEmergency}
      />

      {/* Map & Log Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px', alignItems: 'stretch', minHeight: '550px' }}>
        
        {/* Map Panel */}
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <LiveMap 
            stations={stations}
            tracks={tracks}
            trains={trains}
            onSelectTrain={onSelectTrain}
            onSelectStation={onSelectStation}
          />
        </div>

        {/* Real-time Ticker Logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px' }}>
          <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="var(--clr-primary)" /> Live Event Stream
          </h3>
          <div style={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--text-secondary)'
          }}>
            {alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Awaiting simulation step updates...</p>
            ) : (
              alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--border-glass)', 
                    paddingBottom: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ 
                      color: alert.severity === 'Critical' ? 'var(--clr-crimson)' : 'var(--clr-amber)', 
                      fontWeight: 'bold' 
                    }}>
                      [{alert.type.toUpperCase()}]
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ wordBreak: 'break-all' }}>{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SimulationDashboard;
