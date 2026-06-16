import React from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, Sliders } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  simSpeed: number;
  simMode: string;
  simTime: string;
  onPlayPause: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onChangeMode: (mode: string) => void;
  onTriggerEmergency: (type: string, detail: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  simSpeed,
  simMode,
  simTime,
  onPlayPause,
  onReset,
  onChangeSpeed,
  onChangeMode,
  onTriggerEmergency
}) => {
  return (
    <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
      
      {/* Time & Play State */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--clr-primary)" /> Control Dashboard
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '10px 0' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SIM TIME</span>
          <span style={{ fontSize: '32px', fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--clr-primary)' }}>{simTime}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn ${isRunning ? 'btn-secondary' : ''}`} onClick={onPlayPause} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, justifyContent: 'center' }}>
            {isRunning ? (
              <>
                <Pause size={16} /> Pause
              </>
            ) : (
              <>
                <Play size={16} /> Start Sim
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title="Reset Simulation">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Speed Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Simulation Speed</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', margin: '8px 0' }}>
          {[1, 5, 10, 50, 100].map(speed => (
            <button 
              key={speed}
              className={`btn ${simSpeed === speed ? '' : 'btn-secondary'}`}
              onClick={() => onChangeSpeed(speed)}
              style={{ padding: '8px 0', fontSize: '12px' }}
            >
              {speed}x
            </button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Active Scale: 1 min tick translates to {1 / simSpeed}s sleep intervals.
        </span>
      </div>

      {/* Traffic Modes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Traffic Operation Mode</h4>
        <select 
          className="form-input" 
          value={simMode} 
          onChange={(e) => onChangeMode(e.target.value)}
          style={{ height: '40px', marginTop: '5px' }}
        >
          <option value="Normal">Normal Mode</option>
          <option value="Rush Hour">Rush Hour (High Density)</option>
          <option value="Festival Traffic">Festival Load (Long Dwell)</option>
          <option value="Emergency">Emergency (Reduced Speed)</option>
          <option value="Maintenance Shutdown">Maintenance Diversions</option>
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Alters boarding times, base delay probability, and weather factors.
        </span>
      </div>

      {/* Emergency Injectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} color="var(--clr-crimson)" /> Emergency Injectors
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '5px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onTriggerEmergency('accident', 'Collision blockage at TR05 track')}
            style={{ fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            Track Blockage
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onTriggerEmergency('weather', 'Heavy storm front and visibility reduction')}
            style={{ fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            Weather Storm
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onTriggerEmergency('breakdown', 'T003 engine cooling circuit malfunction')}
            style={{ fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            Train Breakdown
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onTriggerEmergency('signal_failure', 'SG_TR01_1 hardware loop fault')}
            style={{ fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            Signal Failure
          </button>
        </div>
      </div>

    </div>
  );
};

export default ControlPanel;
