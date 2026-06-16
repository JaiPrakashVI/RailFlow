import React, { useEffect, useState } from 'react';
import LiveMap from '../components/LiveMap';
import { AlertOctagon, Thermometer } from 'lucide-react';

interface CongestionDashboardProps {
  stations: any[];
  tracks: any[];
  trains: any[];
  onGetBottlenecks: () => Promise<any[]>;
}

const CongestionDashboard: React.FC<CongestionDashboardProps> = ({
  stations,
  tracks,
  trains,
  onGetBottlenecks
}) => {
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);

  useEffect(() => {
    const fetchBottlenecks = async () => {
      try {
        const res = await onGetBottlenecks();
        setBottlenecks(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBottlenecks();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Congestion Heatmap & Bottlenecks</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Visualizing railway section utilization densities and mapping segment conflict hazards.
        </p>
      </div>

      {/* Heatmap Map Overlay */}
      <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={16} color="var(--clr-crimson)" /> Congestion Load Density Map
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Overlay: <span style={{ color: 'var(--clr-crimson)', fontWeight: 'bold' }}>Red (Overloaded)</span>, <span style={{ color: 'var(--clr-amber)', fontWeight: 'bold' }}>Amber (Moderate)</span>, <span style={{ color: 'var(--clr-emerald)', fontWeight: 'bold' }}>Green (Clear)</span>
          </span>
        </div>
        <LiveMap 
          stations={stations}
          tracks={tracks}
          trains={trains}
          congestionOverlay={true}
        />
      </div>

      {/* Bottlenecks Ranking Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertOctagon size={18} color="var(--clr-amber)" /> Section Load Factor & Critical Bottlenecks
        </h3>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Segment ID</th>
              <th>Connecting Stations</th>
              <th>Line Mode</th>
              <th>Speed Limit</th>
              <th>Incident Frequency</th>
              <th>Load Rating</th>
              <th>Risk Severity</th>
            </tr>
          </thead>
          <tbody>
            {bottlenecks.map(b => (
              <tr key={b.track_id}>
                <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{b.track_id}</td>
                <td>
                  {stations.find(s => s.id === b.from_station)?.name ?? b.from_station} &harr; {stations.find(s => s.id === b.to_station)?.name ?? b.to_station}
                </td>
                <td>
                  <span className={`badge ${b.single_line ? 'warning' : 'info'}`}>
                    {b.single_line ? 'Single Line' : 'Double Line'}
                  </span>
                </td>
                <td>{b.speed_limit} km/h</td>
                <td style={{ fontWeight: 600 }}>{b.conflict_count} conflicts</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.05)', height: '6px', width: '80px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${b.congestion_score}%`, 
                          backgroundColor: b.congestion_score > 75 ? 'var(--clr-crimson)' : b.congestion_score > 45 ? 'var(--clr-amber)' : 'var(--clr-emerald)',
                          height: '100%' 
                        }} 
                      />
                    </div>
                    <span>{b.congestion_score}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${b.status.includes('Critical') ? 'danger' : b.status.includes('High') ? 'warning' : 'success'}`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CongestionDashboard;
