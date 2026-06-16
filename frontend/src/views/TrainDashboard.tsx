import React, { useState, useEffect } from 'react';
import { Train as TrainIcon, Navigation, RefreshCw, GitFork } from 'lucide-react';

interface TrainDashboardProps {
  trains: any[];
  tracks: any[];
  selectedTrainId?: string;
  onGetTrainDetails: (trainId: string) => Promise<any>;
  onTriggerReroute: (trainId: string, blockedTrackId: string) => Promise<any>;
}

const TrainDashboard: React.FC<TrainDashboardProps> = ({
  trains,
  tracks,
  selectedTrainId,
  onGetTrainDetails,
  onTriggerReroute
}) => {
  const [selectedTrain, setSelectedTrain] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [blockedTrack, setBlockedTrack] = useState('');
  const [rerouteResult, setRerouteResult] = useState<any>(null);
  const [rerouting, setRerouting] = useState(false);

  useEffect(() => {
    if (selectedTrainId) {
      setSelectedTrain(selectedTrainId);
    } else if (trains.length > 0) {
      setSelectedTrain(trains[0].id);
    }
  }, [selectedTrainId, trains]);

  useEffect(() => {
    if (tracks.length > 0) {
      setBlockedTrack(tracks[0].id);
    }
  }, [tracks]);

  const fetchDetails = async () => {
    if (!selectedTrain) return;
    try {
      const res = await onGetTrainDetails(selectedTrain);
      setDetails(res);
      setRerouteResult(null); // Clear previous rerouting calculations
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [selectedTrain]);

  const handleReroute = async () => {
    if (!selectedTrain || !blockedTrack) return;
    setRerouting(true);
    try {
      const res = await onTriggerReroute(selectedTrain, blockedTrack);
      setRerouteResult(res);
      // Refresh details to fetch new path
      await fetchDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setRerouting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Train Digital Twin Tracking</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Live speed monitoring, signal lock aspects, and dynamic graph rerouting controls.
          </p>
        </div>
        
        <select 
          className="form-input" 
          value={selectedTrain} 
          onChange={(e) => setSelectedTrain(e.target.value)}
          style={{ width: '240px', height: '40px' }}
        >
          {trains.map(t => (
            <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
          ))}
        </select>
      </div>

      {details ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Metadata Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Meta Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrainIcon size={18} color="var(--clr-primary)" /> Train Specifications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Train ID / Name:</span>
                  <span style={{ fontWeight: 'bold' }}>{details.train.id} - {details.train.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                  <span style={{ fontWeight: 'bold' }}>{details.train.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Velocity:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{Math.round(details.train.current_speed)} km/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Accumulated Delay:</span>
                  <span style={{ fontWeight: 'bold', color: details.train.delay > 0 ? 'var(--clr-amber)' : 'var(--clr-emerald)' }}>
                    {details.train.delay > 0 ? `+${details.train.delay} mins` : 'On Time'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Digital Status:</span>
                  <span className={`badge ${
                    details.train.status === 'Running' ? 'success' : 
                    details.train.status === 'Halted' ? 'danger' : 'warning'
                  }`}>
                    {details.train.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Routing block interface */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-purple)' }}>
                <GitFork size={18} /> Dynamic Rerouting Engine
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                In case of track blockage, recalculate the shortest path using Dijkstra bypassing the segment.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BLOCK PATH SEGMENT</label>
                <select className="form-input" value={blockedTrack} onChange={(e) => setBlockedTrack(e.target.value)}>
                  {tracks.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.id}: {tr.from_station_id} &harr; {tr.to_station_id}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-danger" style={{ height: '40px', marginTop: '10px' }} onClick={handleReroute} disabled={rerouting}>
                {rerouting ? 'Re-calculating graph...' : 'Compute Alternative Path'}
              </button>
            </div>

          </div>

          {/* Timetable stops & Rerouting Diff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Reroute path comparison */}
            {rerouteResult && (
              <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(13, 20, 38, 0.6) 100%)' }}>
                <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-purple)' }}>
                  <RefreshCw size={16} /> Routing Route Adjustment Comparison
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', fontSize: '13px' }}>
                  <div style={{ borderLeft: '3px solid var(--clr-crimson)', paddingLeft: '10px' }}>
                    <h4 style={{ color: 'var(--clr-crimson)', fontWeight: 600, fontSize: '12px' }}>PREVIOUS CONGESTED PATH</h4>
                    <p style={{ marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {rerouteResult.old_path_names.join(' → ')}
                    </p>
                  </div>
                  
                  <div style={{ borderLeft: '3px solid var(--clr-emerald)', paddingLeft: '10px' }}>
                    <h4 style={{ color: 'var(--clr-emerald)', fontWeight: 600, fontSize: '12px' }}>DIVERTIED OPTIMIZED PATH</h4>
                    <p style={{ marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {rerouteResult.new_path_names.join(' → ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled stops timetable */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={18} color="var(--clr-primary)" /> Routing Timetable & Waypoint Nodes
              </h3>
              
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Station ID</th>
                    <th>Scheduled Arr</th>
                    <th>Scheduled Dep</th>
                    <th>Actual Arrival</th>
                    <th>Actual Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {details.schedules.map((stop: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold' }}>{stop.station_id}</td>
                      <td>{stop.scheduled_arrival || '--'}</td>
                      <td>{stop.scheduled_departure || '--'}</td>
                      <td style={{ color: 'var(--clr-emerald)' }}>{stop.actual_arrival || '--'}</td>
                      <td style={{ color: 'var(--clr-emerald)' }}>{stop.actual_departure || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <TrainIcon size={48} style={{ opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Select a train from the dropdown to inspect routing.</p>
        </div>
      )}

    </div>
  );
};

export default TrainDashboard;
