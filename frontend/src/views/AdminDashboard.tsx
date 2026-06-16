import React, { useState } from 'react';
import { ShieldAlert, Server, ShieldCheck, Activity } from 'lucide-react';

interface AdminDashboardProps {
  onTriggerEmergency: (type: string, detail: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onTriggerEmergency }) => {
  const [busy, setBusy] = useState<string | null>(null);

  // Simulated Audit logs for layout visual verification
  const auditLogs = [
    { id: 1, user: 'admin', action: 'Solver Schedule Run', time: '18:14:02', details: 'Triggered OR-Tools schedule optimizations; resolved 18 conflicts.' },
    { id: 2, user: 'operator_cbe', action: 'Dynamic Reroute Apply', time: '18:12:45', details: 'Rerouted train T005 via alternative path bypass around track TR05.' },
    { id: 3, user: 'admin', action: 'Auth Login Success', time: '18:05:12', details: 'Successful token credentials dispatch for role: admin.' },
    { id: 4, user: 'system', action: 'Automatic Signal Tick', time: '18:00:00', details: 'Block section SG_TR01_1 auto toggled to RED due to preceding train.' }
  ];

  const handleInject = async (type: string, msg: string) => {
    setBusy(type);
    try {
      await onTriggerEmergency(type, msg);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>System Administration Portal</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Simulate operational failures, monitor background solvers, and inspect system audit trails.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Side: Server Health & Failure Injectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Server Info */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--clr-primary)" /> Infrastructure Health
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>FastAPI Server:</span>
                <span style={{ color: 'var(--clr-emerald)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Active (8000)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>DB Connection:</span>
                <span style={{ color: 'var(--clr-emerald)', fontWeight: 'bold' }}>SQLite Pool Connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Live Broadcaster:</span>
                <span style={{ color: 'var(--clr-emerald)', fontWeight: 'bold' }}>WebSockets Stream OK</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Server Latency:</span>
                <span style={{ color: 'var(--clr-emerald)', fontWeight: 'bold' }}>14ms</span>
              </div>
            </div>
          </div>

          {/* Fault Injector Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-crimson)' }}>
              <ShieldAlert size={18} /> Network Failure Injectors
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-5px' }}>
              Force hardware faults to test scheduling contingency algorithms and routing backups.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <button 
                className="btn btn-danger" 
                disabled={busy !== null}
                onClick={() => handleInject('accident', 'Structural derailment obstruction on section TR03')}
              >
                {busy === 'accident' ? 'Blocking track...' : 'Inject Track Blockage'}
              </button>
              <button 
                className="btn btn-danger" 
                disabled={busy !== null}
                onClick={() => handleInject('weather', 'Typhoon alert: wind velocities exceeding 100km/h')}
              >
                {busy === 'weather' ? 'Triggering storm...' : 'Inject Weather Storm'}
              </button>
              <button 
                className="btn btn-danger" 
                disabled={busy !== null}
                onClick={() => handleInject('breakdown', 'Train T002 engine traction motor ground fault')}
              >
                {busy === 'breakdown' ? 'Stalling train...' : 'Inject Locomotive Breakdown'}
              </button>
              <button 
                className="btn btn-danger" 
                disabled={busy !== null}
                onClick={() => handleInject('signal_failure', 'SG_TR04_2 aspect loop failure')}
              >
                {busy === 'signal_failure' ? 'Forcing RED aspect...' : 'Inject Signal Failure'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Security Audit Logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--clr-primary)" /> Security Audit Trail Logs
          </h3>
          
          <table className="custom-table" style={{ marginTop: '10px' }}>
            <thead>
              <tr>
                <th>Operator</th>
                <th>Operation</th>
                <th>Incident Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 'bold' }}>{log.user}</td>
                  <td style={{ color: 'var(--clr-primary)' }}>{log.action}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
