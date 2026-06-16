import React, { useState, useEffect } from 'react';
import { Building2, Users, Clock } from 'lucide-react';

interface StationDashboardProps {
  stations: any[];
  selectedStationId?: string;
  onGetStationDetails: (stationId: string) => Promise<any>;
}

const StationDashboard: React.FC<StationDashboardProps> = ({
  stations,
  selectedStationId,
  onGetStationDetails
}) => {
  const [selectedStation, setSelectedStation] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (selectedStationId) {
      setSelectedStation(selectedStationId);
    } else if (stations.length > 0) {
      setSelectedStation(stations[0].id);
    }
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (!selectedStation) return;
    const fetchDetails = async () => {
      try {
        const res = await onGetStationDetails(selectedStation);
        setDetails(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetails();
  }, [selectedStation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Station Digital Twin Terminal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Inspect platform allocations, timetables, and load status of individual stations.
          </p>
        </div>
        
        <select 
          className="form-input" 
          value={selectedStation} 
          onChange={(e) => setSelectedStation(e.target.value)}
          style={{ width: '240px', height: '40px' }}
        >
          {stations.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      {details ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Station metadata & Platform occupancy map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Meta */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--clr-primary)" /> Station Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
                  <span style={{ fontWeight: 'bold' }}>{details.station.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Code:</span>
                  <span style={{ fontWeight: 'bold' }}>{details.station.code}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Platforms:</span>
                  <span style={{ fontWeight: 'bold' }}>{details.station.platforms_count}</span>
                </div>
              </div>
            </div>

            {/* Platform Grid */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--clr-purple)" /> Platform Occupancy Grid
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                {Array.from({ length: details.station.platforms_count }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Look for active scheduled train on platform
                  const schedOnPf = details.schedules.find((s: any) => 
                    (s.actual_arrival && !s.actual_departure)
                  );
                  const occupant = schedOnPf ? schedOnPf.train_id : null;
                  
                  return (
                    <div 
                      key={pNum} 
                      style={{ 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: '6px', 
                        padding: '12px', 
                        textAlign: 'center',
                        backgroundColor: occupant ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                        borderColor: occupant ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'
                      }}
                    >
                      <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PF {pNum}</h4>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', color: occupant ? 'var(--clr-crimson)' : 'var(--clr-emerald)' }}>
                        {occupant ? occupant : 'Clear'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Timetables */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--clr-amber)" /> Live Boardings & Dispatches
            </h3>
            
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Train ID</th>
                  <th>Scheduled Arr</th>
                  <th>Scheduled Dep</th>
                  <th>Actual Arr</th>
                  <th>Actual Dep</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {details.schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No scheduling logs for today.</td>
                  </tr>
                ) : (
                  details.schedules.map((s: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{s.train_id}</td>
                      <td>{s.scheduled_arrival || '--'}</td>
                      <td>{s.scheduled_departure || '--'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.actual_arrival || '--'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.actual_departure || '--'}</td>
                      <td>
                        <span className={`badge ${
                          s.actual_arrival && !s.actual_departure ? 'warning' :
                          s.actual_departure ? 'success' : 'info'
                        }`}>
                          {s.actual_arrival && !s.actual_departure ? 'Boarding' :
                           s.actual_departure ? 'Departed' : 'En Route'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Building2 size={48} style={{ opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Select a station from the terminal dropdown to load metrics.</p>
        </div>
      )}

    </div>
  );
};

export default StationDashboard;
