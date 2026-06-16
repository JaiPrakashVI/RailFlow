import React, { useState } from 'react';
import { Search, Signal as SignalIcon } from 'lucide-react';

interface OperationsDashboardProps {
  trains: any[];
  stations: any[];
  conflicts: any[];
  onSelectTrain: (id: string) => void;
  onSelectStation: (id: string) => void;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  trains,
  stations,
  conflicts,
  onSelectTrain,
  onSelectStation
}) => {
  const [activeTab, setActiveTab] = useState<'trains' | 'stations' | 'conflicts'>('trains');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrains = trains.filter(t => 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical': return { color: 'var(--clr-crimson)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'High': return { color: 'var(--clr-amber)', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)' };
      default: return { color: 'var(--clr-primary)', backgroundColor: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.25)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Network Operations Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time listing of active trains, stations, and conflict alerts.</p>
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Search assets or status..." 
            className="form-input" 
            style={{ paddingLeft: '38px', height: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
        {(['trains', 'stations', 'conflicts'] as const).map(tab => (
          <button 
            key={tab}
            className={`btn btn-secondary ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === tab ? '3px solid var(--clr-primary)' : '3px solid transparent',
              borderRadius: 0,
              padding: '12px 24px',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="glass-card" style={{ padding: '0px', overflowX: 'auto' }}>
        {activeTab === 'trains' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Train ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Route</th>
                <th>Speed (km/h)</th>
                <th>Status</th>
                <th>Delay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrains.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.type}</td>
                  <td>{t.source} &rarr; {t.destination}</td>
                  <td>{Math.round(t.speed)} km/h</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'Running' ? 'success' : 
                      t.status === 'Halted' ? 'danger' : 
                      t.status === 'AtStation' ? 'info' : 'warning'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ color: t.delay > 0 ? 'var(--clr-amber)' : 'var(--clr-emerald)', fontWeight: 600 }}>
                    {t.delay > 0 ? `+${t.delay}m` : 'On Time'}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => onSelectTrain(t.id)}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'stations' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Station Code</th>
                <th>Name</th>
                <th>Platforms</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.platforms_count} platforms</td>
                  <td>{s.lat.toFixed(4)}</td>
                  <td>{s.lng.toFixed(4)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => onSelectStation(s.id)}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'conflicts' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {conflicts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <SignalIcon size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p>No active scheduling conflicts detected in this block section.</p>
              </div>
            ) : (
              conflicts.map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', gap: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>INCIDENT</span>
                    <p style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{c.id}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{c.type}</h4>
                      <span className="badge" style={getSeverityStyle(c.severity)}>
                        {c.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>Root Cause:</strong> {c.root_cause}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <strong>Impact:</strong> {c.impact_analysis}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--clr-primary)', marginTop: '4px', fontWeight: 500 }}>
                      <strong>Recommendation:</strong> {c.resolution}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TIMESTAMP</span>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-crimson)' }}>{c.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default OperationsDashboard;
